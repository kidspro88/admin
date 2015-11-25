db.organizations = new Meteor.Collection('organizations')

db.organizations.permit(['insert', 'update', 'remove']).apply();

db.organizations._simpleSchema = new SimpleSchema({
	space: {
		type: String,
		autoform: {
			type: "hidden",
			defaultValue: function(){
				return Session.get("spaceId");
			}
		},
	},
	name: {
		type: String,
		max: 200
	},
	parent: {
		type: String,
		optional: true,
		autoform: {
			type: "select2",
			options: function() {
				options = [{
					label: "",
					value: ""
				}]
				objs = db.organizations.find({}, 
						{
							fields: {fullname: 1}, 
							sort: {fullname:1}
						})
				objs.forEach(function(obj){
					options.push({
						label: obj.fullname,
						value: obj._id
					})
				});
				return options
			}
		}
	},
	sort_no: {
		type: Number,
		optional: true,
		defaultValue: 100
	},
	users: {
		type: [String],
		optional: true,
		autoform: {
			type: "select2",
			afFieldInput: {
				multiple: true
			},
			options: function() {
				options = []
				objs = db.users.find({}, {name:1, sort: {name:1}})
				objs.forEach(function(obj){
					options.push({
						label: obj.name,
						value: obj._id
					})
				});
				return options
			}
		}
	},
	is_company: {
		type: Boolean,
		optional: true,
	},
	parents: {
		type: [String],
		optional: true,
	},
	fullname: {
		type: String,
		optional: true,
	},
	children: {
		type: [String],
		optional: true,
	},
});
db.organizations.attachSchema(db.organizations._simpleSchema);

db.organizations._table = new Tabular.Table({
	name: "Organizations",
	collection: db.organizations,
	lengthChange: false,
	select: {
		style: 'single',
		info: false
	},
	columns: [
		{data: "fullname"},
		{data: "sort_no"},
		{data: "users"}
	],
	extraFields: ["space", "name",'parent'],
	// Filter data by permission
	// selector: function() {
	// 	return {}
	// },
	clientSelector: function() {
		spaceId = Session.get("spaceId")
		if (spaceId)
			return {space: spaceId}
		return {}
	},
});


if (Meteor.isServer) {

	db.organizations.getChildren = function(id){
		children = []
		childrenObjs = db.organizations.find({parent: id}, {});
		childrenObjs.forEach(function(child) {
			children.push(child._id);
		})
		return children;
	};
	db.organizations.getRecursiveChildren = function(id){
		children = []
		childrenObjs = db.organizations.find({parents: id}, {});
		childrenObjs.forEach(function(child) {
			children.push(child._id);
		})
		return children;
	};

	db.organizations.updateChildren = function(id) {
		children = db.organizations.getChildren(id);
		db.organizations.direct.update({
			_id: id
		}, {
			$set: {children: children}
		})
		return children;
	};

	db.organizations.getFullname = function(id){
		org = db.organizations.findOne({_id: id}, {parent: 1, name: 1});

		fullname = org.name;

		if (!org.parent)
			return fullname;

		parentId = org.parent;
		while (parentId){
			parentOrg = db.organizations.findOne({_id: parentId}, {parent: 1, name: 1});
			fullname = parentOrg.name + "/" + fullname;
			parentId = parentOrg.parent
		}

		return fullname
	};

	db.organizations.updateFullname = function(id) {
		fullname = this.getFullname(id)
		db.organizations.direct.update({
			_id: id
		}, {
			$set: {fullname: fullname}
		})
	};

	db.organizations.getParents = function(parent){
		if (!parent)
			return []
		parents = [parent];

		parentId = parent;
		while (parentId){
			parentOrg = db.organizations.findOne({_id: parentId}, {parent: 1, name: 1});
			if (parentOrg)
				parentId = parentOrg.parent
			else
				parentId = null

			if (parentId){
				parents.push(parentId)
			}
		}

		return parents
	};

	db.organizations.before.remove(function(userId, doc){
		if (doc.children && doc.children.length>0)
			throw new Meteor.Error(400, t("organizations_error.delete_with_children"));
	});

	db.organizations.before.insert(function(userId, doc){
		doc.created_by = userId;
		doc.created = new Date();

		doc.parents = db.organizations.getParents(doc.parent);
		doc.is_company = !doc.parent;
	});

	db.organizations.before.update(function(userId, doc, fieldNames, modifier, options){
		modifier.$set = modifier.$set || {};
		modifier.$set.modified_by = userId;
		modifier.$set.modified = new Date();

		if (modifier.$set.parent){
			// parent 不能等于自己或者children
			parentOrg = db.organizations.findOne({_id: modifier.$set.parent})
			if (doc._id == parentOrg._id || parentOrg.parents.indexOf(doc._id)>=0)
				throw new Meteor.Error(400, t("organizations_error.parent_is_self"));

			// 更新parents
			modifier.$set.parents = db.organizations.getParents(modifier.$set.parent);
		} 

	});

	db.organizations.after.insert(function(userId, doc){
		if (doc.parent)
			db.organizations.updateChildren(doc.parent);
		db.organizations.updateFullname(doc._id);
	});

	db.organizations.after.update(function(userId, doc, fieldNames, modifier, options){
		// 如果更改 parent，更改前后的对象都需要重新生成children
		if (doc.parent){
			children = db.organizations.updateChildren(doc.parent);
		}
		if (modifier.$set.parent)
			children = db.organizations.updateChildren(modifier.$set.parent);

		// 如果更改 parent 或 name, 需要更新 自己和孩子们的 fullname	
		if (modifier.$set.parent || modifier.$set.name){
			db.organizations.updateFullname(doc._id);
			children = db.organizations.getRecursiveChildren(doc._id);
			_.each(children, function(childId){
				db.organizations.updateFullname(childId);
			})
		}

	})
}

Steedos_table_Helpers = {};
Template.registerHelper("Steedos_table_Helpers", Steedos_table_Helpers);

function arrayify(obj){
    result = [];
    for(var key in obj){
    result.push({code:key, value:obj[key]})
    }
    return result;
}


Template.registerHelper("arrayify", function(obj){
  return arrayify(obj);
});

Steedos_table_Helpers.equals = function (a, b) {
  return a === b;
};


Steedos_table_Helpers.initValidrows = function (arr){
    var validrows = new Array();
    for(var i = 0 ; i < arr.length ; i++){
      validrows.push(i + "");
    }
    return validrows.toString();
};

Steedos_table_Helpers.removeValidrows = function (validrows_str, row_index){
    var validrows = new Array();
    if (validrows_str !="")
        validrows = validrows_str.split(",");
    var id = validrows.indexOf(row_index);
    debugger;
    if (id > -1)
        validrows.splice(id,1);
    return validrows.toString();
};

Steedos_table_Helpers.addValidrows = function (validrows_str, row_index){
    var validrows = new Array();
    if (validrows_str !="")
        validrows = validrows_str.split(",");
    validrows.push(row_index);
    return validrows.toString();
};

Steedos_table_Helpers.getValidrowIndex = function (validrows_str, row_index){
    var validrows = new Array();
    if (validrows_str !="")
        validrows = validrows_str.split(",");
    return validrows.indexOf(row_index);
}

Steedos_table_Helpers.add_row = function (row_index, formfieldcode, rowobj){
    var row_html = "<td>" + row_index + "</td>";

    for(var key in rowobj){
        row_html = row_html + "<td>" + $("[name='"+(formfieldcode + ".$." + key)+"']").val() + "</td>";
    }

    row_html = row_html + 
    "<td><span class='panel-controls'>"+ 
      "<i class='remove icon remove-steedos-table-row' data-rowindex='" + row_index + "'></i>" +
      "&nbsp;&nbsp;<i class='write icon edit-steedos-table-row' data-rowindex='" + row_index + "'></i>" +
    "</span></td>" ;
    $("[name='"+row_index+"row']").html(row_html);
};

var create_tr_html = function(){

};

Steedos_table_Helpers.update_row = function (){

};

let messageService = {
    "showError": function (message, dataSource) {
        $("#success-" + dataSource).addClass('d-none');
        $("#error-" + dataSource).removeClass('d-none');
        $("#error-" + dataSource).html(message);
    },
    "showSuccess": function (message, dataSource) {
        $("#error-" + dataSource).addClass('d-none');
        $("#success-" + dataSource).removeClass('d-none');
        $("#success-" + dataSource).html(message);
    },
   "hide": function(dataSource) {
     $("#error-" + dataSource).addClass('d-none');
     $("#success-" + dataSource).addClass('d-none');
   },
    "hideErrorShowSuccess": function(dataSource) {
        $("#success-" + dataSource).removeClass('d-none');
        $("#error-" + dataSource).addClass('d-none');
    }
}

module.exports = messageService
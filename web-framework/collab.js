var CollabExtension = {
    append_buttons: function () {
        var cx_main = $(".cx_main");
        for (var i = 0; i < cx_main.length; i ++) {
            var local_cx = $(cx_main[i]);
            if (local_cx.find(".expand.edit").length === 0) {
                var data_nsent = local_cx.find(".expand")[0].getAttribute('data-nsent');
                var edit_button = '<span class="expand edit_parent" data-nsent="' + data_nsent + '">';
                edit_button += '<span class="glyph_expand edit_glyph glyphicon glyphicon-pencil" aria-hidden="true">';
                edit_button += '</span></span>';
                local_cx.append(edit_button);
            }
        }
    }
};
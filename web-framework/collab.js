var CollabExtension = {
    appendButtons: function () {
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
        $(".edit_parent, .edit_glyph").unbind('click');
        $(".edit_parent").bind("click.edit_popup", function () {
            CollabExtension.callEditPopup($(this).parent().find(".sentence .sent_lang").first());
        })
    },
    callEditPopup: function (el) {
        // $($($(".sent_lang")[0]).find("span")[0]).attr('data-ana')
        console.log(el);
    },
    makeInitialStructure: function (sent_lang_obj) {
        var slo = sent_lang_obj;
        var slo_words = sent_lang_obj.find(".word");
        var parsed_structure = [];
        for (var i = 0; i < slo_words.length; i ++) {
            parsed_structure.push(CollabExtension.parseDataAna($(slo_words[i]).attr("data-ana")));
        }
        return parsed_structure;
    },
    parseDataAna: function (data_ana) {
        data_ana = $(data_ana);
        var pw = data_ana.find(".popup_word");
        // ...
    }
};
var CollabExtension = {
    appendButtons: function () {
        var cx_main = $(".cx_main");
        for (var i = 0; i < cx_main.length; i ++) {
            var local_cx = cx_main.eq(i);
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
        // $(".sent_lang").eq(0).find("span").eq(0).attr('data-ana')
        CollabExtension.makeInitialStructure(el);
    },
    makeInitialStructure: function (sent_lang_obj) {
        var slo = sent_lang_obj;
        var slo_words = sent_lang_obj.find(".word");
        var parsed_structure = [];
        for (var i = 0; i < slo_words.length; i ++) {
            parsed_structure.push(CollabExtension.parseTokenAna(slo_words.eq(i).attr("data-ana")));
        }
        return parsed_structure;
    },
    parseTokenAna: function (token_popup) {
        token_popup = $(token_popup);
        var wf_diff = [];
        var pw = token_popup.find(".popup_word");
        var pw_wf = token_popup.find(".popup_wf");
        var pw_ana_groups = token_popup.find(".popup_ana");
        for (var i = 0; i < pw_ana_groups.length; i ++) {
            var ana_group = pw_ana_groups.eq(i);
            wf_diff.push({
                "wf": pw_wf.text()
            });
            wf_diff[i].lex = ana_group.find(".popup_lex").text();
            wf_diff[i].parts = ana_group.find(".popup_gloss .popup_value").eq(0).text();
            wf_diff[i].gloss = ana_group.find(".popup_gloss .popup_value").eq(0).text();
            if (ana_group.find(".popup_pos").text()) {
                wf_diff[i].pos = ana_group.find(".popup_pos").text();
            } else {
                wf_diff[i].pos = null;
            }
            wf_diff[i].trackbacks = [];
            var trackbacks = ana_group.find(".popup_field");
            for (var j = 0; j < trackbacks.length; j ++) {
                var pk = trackbacks.eq(j).find(".popup_key").text();
                var pv = trackbacks.eq(j).find(".popup_value").text();
                if (pv !== "" && pv !== undefined) {
                    var pvs = pv.split(/,\s+/g);
                    for (var k = 0; k < pvs.length; k ++) {
                        wf_diff[i].trackbacks.push(pvs[k]);
                    }
                }
            }
        }
        return wf_diff;
    }
};
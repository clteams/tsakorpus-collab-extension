var CollabExtension = {
    appendButtons: function () {
        var cx_main = $(".cx_main");
        for (var i = 0; i < cx_main.length; i ++) {
            var local_cx = cx_main.eq(i);
            if (local_cx.find(".expand.edit").length === 0) {
                var data_nsent = local_cx.find(".expand")[0].getAttribute('data-nsent');
                var edit_button = '<span class="expand edit_parent" button-id="' + CollabExtension.createEditButtonID();
                edit_button += '" data-nsent="' + data_nsent + '">';
                edit_button += '<span class="glyph_expand edit_glyph glyphicon glyphicon-pencil" aria-hidden="true">';
                edit_button += '</span></span>';
                local_cx.append(edit_button);
            }
        }
        $(".edit_parent, .edit_glyph").unbind('click');
        $(".edit_parent").bind("click.edit_popup", function () {
            CollabExtension.callEditPopup($(this));
        })
    },
    callEditPopup: function (el) {
        var el_is = CollabExtension.makeInitialStructure(el.parent().find(".sentence .sent_lang").first());
        var bid = el.attr("button-id");
        CollabExtension.initialStructures[bid] = el_is;
        var common_dialog_id = "common-dialog-id-" + bid;
        var common_dialog_content = '<div id="' + common_dialog_id + '" title="';
        common_dialog_content += CollabExtension.message("editDocument") + '">';
        for (var k = 0; k < el_is.length; k ++) {
            common_dialog_content += '<a href="#" onclick="CollabExtension.callTokenDialog(\'' + bid + '\', ';
            common_dialog_content += k.toString() + ')">' + el_is[k].token + '</a>&nbsp;';
            common_dialog_content = common_dialog_content.replace(/&nbsp;$/, "");
        }
        common_dialog_content += '</div>';
        el.parent().append(common_dialog_content);
        CollabExtension.submitFunctions[bid] = function () {
            CollabExtension.submitDiffOn(bid);
        };
        CollabExtension.buttonDialogs[bid] = {
            commonDialog: null, // ...
            tokenDialogs: [] // ...
        };
        CollabExtension.buttonDialogs[bid].commonDialog = $("#" + common_dialog_id).dialog({
            autoOpen: false,
            height: 200,
            width: 800,
            modal: true,
            buttons: {
                CollabExtension.message("submitEdits"): addUser,
                Cancel: function() {
                    CollabExtension.buttonDialogs[bid].commonDialog.dialog("close");
                }
            },
            close: function() {}
        });
        CollabExtension.buttonDialogs[bid].commonDialog.dialog("open");
    },
    createEditButtonID: function () {
        var button_id = "";
        var hex_array = "0123456789abcdef";
        for (var i = 0; i < 10; i ++) {
            button_id += hex_array.charAt(Math.floor(Math.random() * hex_array.length))
        }
        return button_id;
    },
    initialStructures: {},
    buttonDialogs: {},
    diffsOnStructures: {},
    submitFunctions: {},
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
            wf_diff[i].gloss = ana_group.find(".popup_gloss .popup_value").eq(1).text();
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
        return {token: pw_wf.text(), anaData: wf_diff};
    },
    submitDiffOn: function (bid) {
        // login
        // merge diff
    },
    diffValue: {
        trackbackValue: {
            change: {
                status: "trackbackValue",
                action: "change",
                from: null,
                to: null
            },
            remove: {
                status: "trackbackValue",
                action: "remove",
                from: null
            }
        },
        simpleValue: {
            change: {
                status: "simpleValue",
                action: "change",
                key: null,
                from: null,
                to: null
            },
            remove: {
                status: "simpleValue",
                action: "remove",
                key: null
            },
            add: {
                status: "simpleValue",
                action: "add",
                key: null,
                value: null
            }
        }
    },
    diffAna: {
        change: {
            status: "diffAna",
            action: "change",
            anaIndex: null,
            anaValues: []
        },
        remove: {
            status: "diffAna",
            action: "remove",
            anaIndex: null
        },
        add: {
            status: "diffAna",
            action: "add",
            anaIndex: null,
            anaValues: []
        }
    },
    interfaceLanguage: "ru",
    message: function (messageKey) {
        return CollabExtension.interfaceMessages[messageKey][CollabExtension.interfaceLanguage];
    }
    interfaceMessages: {
        "editDocument": {
            "ru": "Редактирование документа"
        },
        "submitEdits": {
            "ru": "Отправить изменения"
        }
    }
};
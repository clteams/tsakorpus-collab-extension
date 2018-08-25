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
    callTokenDialog: function (bid, index) {
        CollabExtension.buttonDialogs[bid].tokenDialogs[index].dialog("open");
    },
    callEditPopup: function (el) {
        var el_is = CollabExtension.makeInitialStructure(el.parent().find(".sentence .sent_lang").first());
        var bid = el.attr("button-id");
        CollabExtension.initialStructures[bid] = el_is;
        CollabExtension.buttonDialogs[bid] = {
            commonDialog: null, // ...
            tokenDialogs: [] // ...
        };
        var common_dialog_id = "common-dialog-id-" + bid;
        var common_dialog_content = '<div id="' + common_dialog_id + '" title="';
        common_dialog_content += CollabExtension.message("editDocument") + '">';
        common_dialog_content += '<div class="token-sequence-wrapper">';
        for (var k = 0; k < el_is.length; k ++) {
            common_dialog_content += '<a href="#" onclick="CollabExtension.callTokenDialog(\'' + bid + '\', ';
            common_dialog_content += k.toString() + ')" class="edit-dialog-token">' + el_is[k].token + '</a>&nbsp;';
        }
        common_dialog_content = common_dialog_content.replace(/&nbsp;$/, "");
        common_dialog_content += '</div>';
        // Create token dialogs
        for (var k = 0; k < el_is.length; k ++) {
            var token_dialog_id = "token-dialog-id-" + bid + "-" + k.toString();
            common_dialog_content += CollabExtension.createTokenDialog(token_dialog_id, el_is[k].anaData);
            CollabExtension.diffSubmitters[bid] = function () {
                CollabExtension.submitTokenDiff(bid, k);
            };
            var buttons = {
                Cancel: function() {
                    CollabExtension.buttonDialogs[bid].tokenDialogs[k].dialog("close");
                }
            };
            buttons[CollabExtension.message("submitTokenDiff")] = CollabExtension.diffSubmitters[token_dialog_id];
            var local_dialog = $("#" + token_dialog_id).dialog({
                autoOpen: false,
                height: 300,
                width: 400,
                modal: true,
                buttons: buttons,
                close: function() {}
            });
            CollabExtension.buttonDialogs[bid].tokenDialogs.push(local_dialog);
        }
        //
        common_dialog_content += '</div>';
        el.parent().append(common_dialog_content);
        CollabExtension.submitFunctions[bid] = function () {
            CollabExtension.submitDiffOn(bid);
        };
        var buttons = {
            Cancel: function() {
                CollabExtension.buttonDialogs[bid].commonDialog.dialog("close");
            }
        };
        buttons[CollabExtension.message("submitEdits")] = CollabExtension.submitFunctions[bid];
        CollabExtension.buttonDialogs[bid].commonDialog = $("#" + common_dialog_id).dialog({
            autoOpen: false,
            height: 300,
            width: 800,
            modal: true,
            buttons: buttons,
            close: function() {}
        });
        CollabExtension.buttonDialogs[bid].commonDialog.dialog("open");
    },
    submitTokenDiff: function (bid, index) {
        console.log(bid, index);
    },
    createEditButtonID: function () {
        return CollabExtension.createRandomID()
    },
    createRandomID: function () {
        var button_id = "";
        var hex_array = "0123456789abcdef";
        for (var i = 0; i < 10; i ++) {
            button_id += hex_array.charAt(Math.floor(Math.random() * hex_array.length))
        }
        return button_id;
    },
    createTokenDialog: function (tokenDialogID, anaData) {
        var token_dialog_content = '<div id="' + tokenDialogID + '" title="' + CollabExtension.message("editToken");
        token_dialog_content += '">';
        if (!anaData) {
            token_dialog_content += '<div class="no-ana-groups">' + CollabExtension.message("noAnaGroups") + '</div>';
        }
        else {
            for (var a = 0; a < anaData.length; a ++) {
                token_dialog_content += CollabExtension.deployAnaGroup(anaData[a], true);
            }
        }
        token_dialog_content += '<input type="hidden" class="ana-groups-events" value="[]">';
        token_dialog_content += '</div>';
        return token_dialog_content;
    },
    deployAnaGroup: function (anaGroup, isDefault) {
        var deployed_ana = '<div class="ana-group">';
        // insert simple values
        deployed_ana += CollabExtension.anaGroupAdd.simpleValue("lex", anaGroup.lex);
        deployed_ana += CollabExtension.anaGroupAdd.simpleValue("parts", anaGroup.parts);
        deployed_ana += CollabExtension.anaGroupAdd.simpleValue("parts", anaGroup.parts);
        //
        deployed_ana += '<input type="hidden" class="ana-values-events" value="[]">';
        deployed_ana += '</div>';
        // if not isDefault -> make 'add' diff
        return deployed_ana;
    },
    anaGroupAdd: {
        simpleValue: function (key, value) {
            var sv = '<div class="ana-simple-value">';
            sv += '<button type="button" onclick="CollabExtension.anaGroupRemove.simpleValue(this)">';
            sv += CollabExtension.message("removeAnaValue") + '</button>';
            sv += '<simple-value-key key="' + key + '"></simple-value-key>';
            sv += '<label for="simple-value-value">' + key + ':</label>';
            sv += $('<input type="text" name="simple-value-value">').attr("value", value).get()[0].outerHTML;
            sv += '</div>';
            return sv;
        }
    },
    anaGroupRemove: {
        simpleValue: function (button_element) {
            button_element = $(button_element);
            var sv_key = button_element.parent().find("simple-value-key").attr("key");
            var parent_ana_group = button_element.parent().parent();
            var new_ve = CollabExtension.getValuesEvents(parent_ana_group);
            var remove_event = $.extend({}, CollabExtension.diffValue.simpleValue.remove);
            remove_event.key = sv_key;
            new_ve.push(remove_event);
            CollabExtension.setValuesEvents(
                parent_ana_group,
                new_ve
            );
        }
    },
    getValuesEvents: function (anaGroup) {
        return JSON.parse($(anaGroup).find(".ana-values-events").val());
    },
    setValuesEvents: function (anaGroup, newValuesEvents) {
        $(anaGroup).find(".ana-values-events").val(JSON.stringify(newValuesEvents));
    },
    getGroupsEvents: function (tokenDialog) {
        return JSON.parse($(tokenDialog).find(".ana-groups-events").val());
    },
    setGroupsEvents: function (tokenDialog, newGroupsEvents) {
        $(tokenDialog).find(".ana-groups-events").val(JSON.stringify(newGroupsEvents));
    },
    initialStructures: {},
    wfDiffSequences: {},
    buttonDialogs: {},
    diffsOnStructures: {},
    submitFunctions: {},
    diffSubmitters: {},
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
    },
    interfaceMessages: {
        "editDocument": {
            "ru": "Редактирование документа"
        },
        "editToken": {
            "ru": "Редактирование токена"
        },
        "noAnaGroups": {
            "ru": "Для этого токена не указано ни одного разбора"
        },
        "removeAnaValue": {
            "ru": "Удалить"
        },
        "submitEdits": {
            "ru": "Отправить изменения"
        },
        "submitTokenDiff": {
            "ru": "Сохранить"
        }
    }
};
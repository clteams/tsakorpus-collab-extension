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
        }
        //
        common_dialog_content += '</div>';
        el.parent().append(common_dialog_content);
        for (var k = 0; k < el_is.length; k ++) {
            var token_dialog_id = "token-dialog-id-" + bid + "-" + k.toString();
            CollabExtension.diffSubmitters[token_dialog_id] = (function (k_) {
                return function () {
                    CollabExtension.submitTokenDiff(bid, k_);
                }
            })(k);
            var buttons = {};
            buttons[CollabExtension.message("cancelAction")] = (function (k_) {
                return function () {
                    CollabExtension.buttonDialogs[bid].tokenDialogs[k_].dialog("close");
                }
            })(k);
            buttons[CollabExtension.message("submitTokenDiff")] = CollabExtension.diffSubmitters[token_dialog_id];
            CollabExtension.buttonDialogs[bid].tokenDialogs.push(
            $("#" + token_dialog_id).dialog({
                autoOpen: false,
                height: 300,
                width: 400,
                modal: true,
                buttons: buttons,
                close: function() {}
            }));
        }
        CollabExtension.submitFunctions[bid] = function () {
            CollabExtension.submitDiffOn(bid);
        };
        var buttons = {};
        buttons[CollabExtension.message("cancelAction")] = function () {
            CollabExtension.buttonDialogs[bid].commonDialog.dialog("close");
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
        // diffAna.add with anaValues=[]
        if (!CollabExtension.diffsOnStructures[bid]) {
            CollabExtension.diffsOnStructures[bid] = [];
            for (var k = 0; k < CollabExtension.initialStructures[bid].length; k ++) {
                CollabExtension.diffsOnStructures[bid].push({
                    token: null,
                    diff: null
                });
                CollabExtension.diffsOnStructures[bid][k].token = CollabExtension.initialStructures[bid][k].token;
            }
        }
        CollabExtension.diffsOnStructures[bid][index].diff = CollabExtension.parseTotalToken(bid, index);
    },
    parseTotalToken: function (bid, index) {
        var dlg = $("#token-dialog-id-" + bid + "-" + index);
        var ana_groups = dlg.find(".ana-group");
        var ag_e = JSON.parse(dlg.find(".ana-groups-events").val());
        var visited_indices = [];
        for (var k = 0; k < ag_e.length; k ++) {
            if (ag_e[k].status == "diffAna" && ag_e[k].action == "add") {
                ag_e[k].anaValues = CollabExtension.parseTotalAnaGroup(dlg, ag_e[k].anaIndex);
                visited_indices.push(ag_e[k].anaIndex);
            }
        }
        for (var i = 0; i < ana_groups.length; i ++) {
            if (visited_indices.indexOf(ana_groups.eq(i).attr("ana-index")) != -1) {
                continue;
            }
            var ag_changes = CollabExtension.parseTotalAnaGroup(dlg, i);
            if (ag_changes) {
                var agc = $.extend({}, CollabExtension.diffAna.change);
                agc.anaIndex = i;
                agc.anaValues = ag_changes;
                ag_e.push(agc);
            }
        }
        return ag_e;
    },
    parseTotalAnaGroup: function (dialog, index) {
        var ana_group = dialog.find(".ana-group[ana-index=" + index + "]");
        var av_events = JSON.parse(ana_group.find(".ana-values-events").val());
        var simple_values = ana_group.find(".ana-simple-value");
        var trackback_values = ana_group.find(".ana-trackback-value");
        for (var a = 0; a < simple_values.length; a ++) {
            var val = simple_values.eq(a).find("[name='simple-value-value']");
            if (val.attr("source-value") != val.val()) {
                var sv_change = $.extend({}, CollabExtension.diffValue.simpleValue.change);
                sv_change.key = simple_values.eq(a).find("simple-value-key").attr("key");
                sv_change.from = val.attr("source-value");
                sv_change.to = val.val();
                av_events.push(sv_change);
            }
        }
        for (var b = 0; b < trackback_values.length; b ++) {
            var val = trackback_values.eq(b).find("[name='trackback-value-value']");
            if (val.attr("source-value") != val.val()) {
                var tv_change = $.extend({}, CollabExtension.diffValue.trackbackValue.change);
                tv_change.from = val.attr("source-value");
                tv_change.to = val.val();
                av_events.push(tv_change);
            }
        }
        return av_events;
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
                token_dialog_content += CollabExtension.deployAnaGroup(anaData[a], a, true);
                if (a < anaData.length - 1) {
                    token_dialog_content += '<br>';
                }
            }
        }
        // insert 'add group' button
        token_dialog_content += '<button type="button" class="insert-ag" onclick="CollabExtension.insertAnaGroup(this)"';
        token_dialog_content += '>' + CollabExtension.message("insertAnaGroup");
        token_dialog_content += '</button>';
        token_dialog_content += '<input type="hidden" class="ana-groups-events" value="[]">';
        token_dialog_content += '</div>';
        return token_dialog_content;
    },
    insertAnaGroup: function (button) {
        var token_dialog = $(button).parent();
        token_dialog.find(".ana-group").each(function(index) {
            $(this).attr("ana-index", index);
        });
        var ani = (
            token_dialog.find(".ana-group").length ?
            token_dialog.find(".ana-group").length : 0
        );
        var ag_object = $(CollabExtension.deployAnaGroup({trackbacks: []}, ani, false));
        if (token_dialog.find(".ana-group").length) {
            ag_object.insertAfter(
                token_dialog.find(".ana-group").last()
            );
        } else {
            ag_object.insertBefore(
                token_dialog.find(".insert-ag")
            );
        }
        $(".ana-group.added").each(function() {
            var p2 = $(this).parent();
            var ge = CollabExtension.getGroupsEvents(p2);
            var ag = $.extend({}, CollabExtension.diffAna.add);
            ag.anaIndex = Number($(this).attr("ana-index"));
            ge.push(ag);
            CollabExtension.setGroupsEvents(p2, ge);
        })
        $(".ana-group.added").removeClass("added");
    },
    insertSimpleValue: function (button) {
        var sv_object = $(CollabExtension.anaGroupAdd.simpleValue(
            $(button).parent().find("[name='simple-values2add'] option:selected").val(),
            $(button).parent().find(".sv2add-value").val(),
            false
        ));
        if ($(button).parent().find(".ana-simple-value").length) {
            sv_object.insertAfter(
                $(button).parent().find(".ana-simple-value").last()
            );
        } else {
            sv_object.insertBefore(
                $(button).parent().find(".insert-sv")
            );
        }
        $(".ana-simple-value.added").each(function() {
            var p2 = $(this).parent();
            var ge = CollabExtension.getValuesEvents(p2);
            var av = $.extend({}, CollabExtension.diffValue.simpleValue.add);
            av.key = $(this).find("simple-value-key").attr("key");
            av.value = $(this).find("[name='simple-value-value']").val();
            ge.push(av);
            CollabExtension.setValuesEvents(p2, ge);
        });
        $(".ana-simple-value.added").removeClass("added");
    },
    insertTrackbackValue: function (button) {
        var tv_object = $(CollabExtension.anaGroupAdd.trackbackValue(
            $(button).parent().find(".tv2add-value").val(),
            false
        ));
        if ($(button).parent().find(".ana-trackback-value").length) {
            tv_object.insertAfter(
                $(button).parent().find(".ana-trackback-value").last()
            );
        } else {
            tv_object.insertBefore(
                $(button).parent().find(".insert-sv")
            );
        }
        $(".ana-trackback-value.added").each(function() {
            var p2 = $(this).parent();
            var ge = CollabExtension.getValuesEvents(p2);
            var av = $.extend({}, CollabExtension.diffValue.trackbackValue.add);
            av.to = $(this).find("[name='trackback-value-value']").val();
            ge.push(av);
            CollabExtension.setValuesEvents(p2, ge);
        });
        $(".ana-trackback-value.added").removeClass("added");
    },
    deployAnaGroup: function (anaGroup, anaIndex, isDefault) {
        var deployed_ana = '<div class="ana-group' + (!isDefault ? " added" : "") + '"';
        deployed_ana += ' ana-index="' + anaIndex + '">';
        // insert simple values
        if (anaGroup.lex)
            deployed_ana += CollabExtension.anaGroupAdd.simpleValue("lex", anaGroup.lex, true);
        if (anaGroup.parts)
            deployed_ana += CollabExtension.anaGroupAdd.simpleValue("parts", anaGroup.parts, true);
        if (anaGroup.gloss)
            deployed_ana += CollabExtension.anaGroupAdd.simpleValue("gloss", anaGroup.gloss, true);
        if (anaGroup.pos)
            deployed_ana += CollabExtension.anaGroupAdd.simpleValue("pos", anaGroup.pos, true);
        // insert trackback-values
        for (var k = 0; k < anaGroup.trackbacks.length; k ++) {
            deployed_ana += CollabExtension.anaGroupAdd.trackbackValue(anaGroup.trackbacks[k], true);
        }
        // insert add-forms
        deployed_ana += '<button type="button" class="insert-sv" onclick="CollabExtension.insertSimpleValue(this)">';
        deployed_ana += CollabExtension.message("addSimpleValue") + '</button> ';
        var sv_options = "<select name='simple-values2add'>";
        var sv_list = ["lex", "parts", "gloss", "pos"];
        for (var k = 0; k < sv_list.length; k ++) {
            sv_options += '<option value="' + sv_list[k] + '">' + sv_list[k] + '</option>';
        }
        sv_options += "</select>";
        deployed_ana += sv_options + ' <input type="text" class="sv2add-value"><br>';
        //
        deployed_ana += '<button type="button" class="insert-tv" onclick="CollabExtension.insertTrackbackValue(this)">';
        deployed_ana += CollabExtension.message("addTrackbackValue") + '</button> ';
        deployed_ana += ' <input type="text" class="tv2add-value">';
        //
        deployed_ana += '<input type="hidden" class="ana-values-events" value="[]">';
        deployed_ana += '</div>';
        return deployed_ana;
    },
    anaGroupAdd: {
        simpleValue: function (key, value, isDefault) {
            var sv = '<div class="ana-simple-value' + (!isDefault ? " added" : "") + '">';
            sv += '<button type="button" onclick="CollabExtension.anaGroupRemove.simpleValue(this)">';
            sv += CollabExtension.message("removeAnaValue") + '</button>';
            sv += '<simple-value-key key="' + key + '"></simple-value-key>';
            sv += '<label for="simple-value-value">' + key + ':</label>';
            sv += $(
                '<input type="text" name="simple-value-value">'
            ).attr("value", value).attr("source-value", value).get()[0].outerHTML;
            sv += '</div>';
            return sv;
        },
        trackbackValue: function (value, isDefault) {
            var tv = '<div class="ana-trackback-value' + (!isDefault ? " added" : "") + '">';
            tv += '<button type="button" onclick="CollabExtension.anaGroupRemove.trackbackValue(this)">';
            tv += CollabExtension.message("removeAnaValue") + '</button>';
            tv += '<label for="trackback-value-value">?:</label> ';
            tv += $(
                '<input type="text" name="trackback-value-value">'
            ).attr("value", value).attr("source-value", value).get()[0].outerHTML;
            tv += '</div>';
            return tv;
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
            button_element.parent().remove();
        },
        trackbackValue: function (button_element) {
            button_element = $(button_element);
            var parent_ana_group = button_element.parent().parent();
            var new_ve = CollabExtension.getValuesEvents(parent_ana_group);
            var remove_event = $.extend({}, CollabExtension.diffValue.trackbackValue.remove);
            remove_event.from = button_element.parent().find("[name='trackback-value-value']").val();
            new_ve.push(remove_event);
            CollabExtension.setValuesEvents(
                parent_ana_group,
                new_ve
            );
            button_element.parent().remove();
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
            },
            add: {
                status: "trackbackValue",
                action: "add",
                to: null
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
        "addSimpleValue": {
            "ru": "Добавить"
        },
        "addTrackbackValue": {
            "ru": "Добавить другое"
        },
        "cancelAction": {
            "ru": "Отмена"
        },
        "editDocument": {
            "ru": "Редактирование документа"
        },
        "editToken": {
            "ru": "Редактирование токена"
        },
        "insertAnaGroup": {
            "ru": "Добавить разбор"
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
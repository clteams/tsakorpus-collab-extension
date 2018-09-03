#!/usr/bin/python3

import json
import random
import sqlite3

collab_path = "./web_app/collab"


def random_hex(length=30):
    return ''.join(random.choice("1234567890abcdef") for _ in range(length))


class DiffProcessor:
    def __init__(self, user_token, ajax_diff_json):
        self.token = user_token
        self.ag = AuthenticationAgent(collab_path)
        self.username = None
        try:
            self.username = self.ag.check_token(self.token)["user"]
            diff_id = random_hex()
            self.ha = HistoryAgent(collab_path)
            framing = FileSequenceFraming(
                ajax_diff_json["corpus_name"],
                ajax_diff_json["file_name"],
                [x["token"] for x in ajax_diff_json["tokens"]]
            )
            self.ha.add_diff(diff_id, self.username, ajax_diff_json["tokens"], framing.found_pairs)
            self.ha.stop()
            self.response = {
                "status": 200,
                "code": "diff-saved"
            }

        except ValueError:
            self.response = {
                "status": "error",
                "code": "invalid-token"
            }


class FileSequenceFraming:
    def __init__(self, corpus_name, file_name, token_list):
        self.corpus_name = corpus_name
        self.file_name = file_name
        self.token_list = token_list
        self.file_path = "../corpus/%s/%s.json" % (self.corpus_name, self.file_name,)
        self.file_json = json.loads(open(self.file_path).read())
        self.sentences = self.file_json["sentences"]
        self.token_index = 0
        self.found_pairs = []
        for n, sentence in enumerate(self.sentences):
            self.find_in_sentence(n)
            if self.token_index == len(self.token_list) - 1:
                break

    def find_in_sentence(self, sentence_index):
        words = self.file_json["sentences"][sentence_index]["words"]
        for j, word in enumerate(words):
            if word["wtype"] != "word":
                continue
            if self.token_index == len(self.token_list) - 1:
                break
            if word["wf"] == self.token_list[self.token_index]:
                self.token_index += 1
                self.found_pairs.append([sentence_index, j])
            else:
                return False
        return True


class HistoryAgent:
    def __init__(self, path):
        self.history_db = sqlite3.connect(path + "/history.sqlite3")
        self.history_cursor = self.history_db.cursor()
        """create table diff_history(diff_id text, by_user text, diff_content text, agent_content text)"""

    def add_diff(self, diff_id, by_user, diff_json, agent_json):
        self.history_cursor.execute(
            "insert into diff_history values (?, ?, ?, ?)",
            (diff_id, by_user, json.dumps(diff_json), json.dumps(agent_json),)
        )

    def stop(self):
        self.history_db.commit()
        self.history_db.close()


class EditAgent:
    def __init__(self, diff_json, agent_json, corpus_name):
        self.corpus_path = "../corpus/%s/" % corpus_name
        self.diff_json_sequence = diff_json
        self.file_name = agent_json["file_name"]
        self.pairs = agent_json["pairs"]
        self.document_file_json = json.loads(open(self.corpus_path + "/" + self.file_name).read())
        self.rewrite_pairs()

    def rewrite_pairs(self):
        for j, pair in enumerate(self.pairs):
            si, wi = pair
            self.document_file_json["sentences"][si]["words"][wi] = self.edit_sector(
                self.document_file_json["sentences"][si]["words"][wi],
                self.diff_json_sequence[j]
            )

    def edit_sector(self, paj, diff):
        for diff_ana in diff:
            if diff_ana["action"] == "add":
                new_ana = self.edit_ana([], diff_ana["anaValues"])
                paj["ana"].append(new_ana)
            elif diff_ana["action"] == "remove":
                try:
                    del paj["ana"][diff_ana["anaIndex"]]
                except IndexError:
                    pass
            elif diff_ana["action"] == "change":
                paj["ana"][diff_ana["anaIndex"]] = self.edit_ana(
                    paj["ana"][diff_ana["anaIndex"]], diff_ana["anaValues"]
                )
        return paj

    def get_trackback_key(self, value):
        return None

    def edit_ana(self, ana_json, ana_diff):
        gpc = [
            va for va in ana_diff if
            va["status"] == "simpleValue" and va["action"] == "change" and "key" in va
            and va["key"] in ["parts", "gloss"]
        ]
        gpc = sorted(gpc, key=lambda x: x["key"])
        for value_action in ana_diff:

            if value_action["action"] == "add":
                if value_action["status"] == "simpleValue":
                    if value_action["key"] == "pos":
                        ana_json["gr.pos"] = value_action["value"]
                    else:
                        ana_json[value_action["key"]] = value_action["value"]
                elif value_action["status"] == "trackbackValue":
                    tv_key = self.get_trackback_key(value_action["to"])
                    if tv_key:
                        ana_json[tv_key] = value_action["to"]

            elif value_action["action"] == "remove":
                if value_action["status"] == "simpleValue":
                    try:
                        del ana_json[value_action["key"] if value_action["key"] != "pos" else "gr.pos"]
                    except KeyError:
                        pass
                elif value_action["status"] == "trackbackValue":
                    for (k, v) in ana_json.items():
                        if v == value_action["from"]:
                            del ana_json[k]
                            break

            elif value_action["action"] == "change":
                if value_action["status"] == "simpleValue":
                    if value_action["key"] == "pos":
                        ana_json["gr.pos"] = value_action["to"]
                    else:
                        ana_json[value_action["key"]] = value_action["to"]
                    if value_action["key"] == "gloss" and len(gpc) == 2:
                        pd_split = gpc[1]["to"].split("-")
                        gd_split = gpc[0]["to"].split("-")
                        if len(pd_split) == len(gd_split):
                            ana_json["gloss_index"] = "-".join([
                                "%s{%s}" % (pd_split[i], gd_split[i],) for i in range(len(pd_split))
                            ]) + "-"
                elif value_action["status"] == "trackbackValue":
                    for (k, v) in ana_json.items():
                        if v == value_action["from"]:
                            ana_json[k] = value_action["to"]
                            break
        return ana_json


class XMLAgent:
    def __init__(self, path):
        self.path = path

    def open_file(self, file_name):
        return open("%s/%s" % (self.path, file_name,), encoding="utf-8").read()


class AuthenticationAgent:
    def __init__(self, path):
        self.auth_db = sqlite3.connect(path + "/authentication.sqlite3")
        self.auth_cursor = self.auth_db.cursor()
        """create table credentials(login text, password text, rights text, token text)"""

    def authorize(self, login, password):
        try:
            pw, = self.auth_cursor.execute("select password from credentials where login=?", (login,)).fetchone()
            if password == pw:
                new_token = random_hex()
                self.auth_cursor.execute("update credentials set token=? where login=?", (new_token, login,))
                self.auth_db.commit()
                return {"token": new_token}
            else:
                raise ValueError("Incorrect password entered")

        except sqlite3.OperationalError as sqe:
            raise ValueError("Unknown DB error occured: " + str(sqe))

        except TypeError:
            raise ValueError("No such user found in the database")

    def check_token(self, token):
        try:
            username, = self.auth_cursor.execute("select login from credentials where token=?", (token,)).fetchone()
            return {"user": username}
        except sqlite3.OperationalError:
            raise ValueError("Unknown DB error occured")

    def stop(self):
        self.auth_db.commit()
        self.auth_db.close()

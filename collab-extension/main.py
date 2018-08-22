#!/usr/bin/python3

import json
import random
import string
import sqlite3


class CollabInstance:
    def __init__(self, auth_token=None):
        self.auth_token = auth_token

    def make_edit(self, focus_sequence, diff_sequence):
        pass


class FileSequenceFraming:
    def __init__(self, corpus_name, file_name, focus_sequence):
        self.corpus_name = corpus_name
        self.file_name = file_name
        self.focus_sequence = focus_sequence
        self.file_path = "../corpus/%s/%s.json" % (self.corpus_name, self.file_name,)
        self.file_json = json.loads(open(self.file_path).read())

    def extract_frame(self):
        punct = [p for p in string.punctuation]
        tokenized_fs = self.focus_sequence.split()
        frame = []
        for in_sentence, sentence in enumerate(self.file_json["sentences"]):
            for wf_index, wf in enumerate(sentence["words"]):
                if wf




class SequenceDiff:
    def __init__(self, diff_sequence):
        self.diff_sequence = diff_sequence
        self.index_based_diff = []

    def edit_group(self, wf_group):
        for j, wf in enumerate(wf_group):
            in_sentence = wf["in_sentence"]
            if "sentence_index" not in wf:
                sentence_index = -1 if not j else -9999
            else:
                sentence_index = wf["sentence_index"]

            for ana_index in enumerate(self.diff_sequence[j]):
                if self.diff_sequence[j][ana_index] is None:
                    continue
                for diff_key in self.diff_sequence[j][ana_index].diff:
                    if diff_key == "trackbacks":
                        continue
                    dk_value = self.diff_sequence[j][ana_index].diff[diff_key]
                    if diff_key == "pos":
                        wf_group[j]["ana"][ana_index]["gr.pos"] = dk_value
                    elif diff_key == "wf":
                        wf_group[j]["wf"] = dk_value
                    elif diff_key in ["lex", "parts", "gloss"]:
                        wf_group[j]["ana"][ana_index][diff_key] = dk_value

                for (tb_key, tb_value) in self.diff_sequence[j][ana_index].diff["trackbacks"].items():
                    for (ana_key, ana_value) in wf["ana"][ana_index].items():
                        if ana_value == tb_value:
                            self.diff_sequence[j][ana_index].reverse_trackback(tb_key, ana_key)
                            wf_group[j]["ana"][ana_index][ana_key] = tb_value

            self.index_based_diff.append([(in_sentence, sentence_index), self.diff_sequence[j]])

        return wf_group

    def summarize_diff(self, parent_diff_id):
        diff_data = {
            "parent_diff": parent_diff_id,
            "current_diff": "".join(random.choice("1234567890abcdef") for _ in range(20)),
            "diff_sequence": self.index_based_diff
        }
        return diff_data


class TokenDiff:
    def __init__(self, diff_json_dict):
        self.analyses = []
        for j, ana in enumerate(diff_json_dict):
            if ana is not None:
                self.analyses.append(TokenAnaDiff(j, ana))
            else:
                self.analyses.append(None)


class TokenAnaDiff:
    def __init__(self, ana_index, diff_json_dict):
        self.ana_index = ana_index
        self.position = None
        self.diff = diff_json_dict
        # wf, lex, parts, gloss, pos, trackbacks -> {...}
        self.diff["gloss_index"] = self.build_gloss_index_diff(self.diff["parts"], self.diff["gloss"])
        self.trackback_diffs = {}
        for (f, t) in self.diff["trackbacks"]:
            self.trackback_diffs[f] = t
        self.tb_reversed = {}

    @staticmethod
    def build_gloss_index_diff(parts_diff, gloss_diff):
        gloss_index_diff = []
        for part in range(2):
            pd_split = parts_diff[part].split("-")
            gd_split = gloss_diff[part].split("-")
            if len(pd_split) != len(gd_split):
                raise ValueError()
            gloss_index_diff.append(
                "-".join(["%s{%s}" % (pd_split[i], gd_split[i],) for i in range(len(pd_split))]) + "-"
            )
        return gloss_index_diff

    def reverse_trackback(self, from_value, role_name):
        self.tb_reversed[role_name] = (from_value, self.trackback_diffs[from_value])

    def build_diff(self):
        diff_data = {
            "ana_index": self.ana_index
        }
        for diff_key in self.diff:
            if diff_key == "trackbacks":
                continue
            else:
                diff_data[diff_key] = self.diff[diff_key]
        for diff_key in self.diff["trackbacks"]:
            diff_data[diff_key] = self.diff["trackbacks"][diff_key]
        return diff_data


class AuthenticationAgent:
    def __init__(self):
        self.auth_db = sqlite3.connect("authentication.sqlite3")
        self.auth_cursor = self.auth_db.cursor()
        """create table credentials(login text, password text, rights text, token text)"""

    def authorize(self, login, password):
        try:
            pw, = self.auth_cursor.execute("select password from credentials where user=?", (login,)).fetchone()
            if password == pw:
                new_token = ''.join(random.choice("1234567890abcdef") for _ in range(20))
                self.auth_cursor.execute("update credentials set token=? where user=?", (new_token, login,))
                self.auth_db.commit()
                return {"token": new_token}
            else:
                raise ValueError()

        except sqlite3.OperationalError:
            raise ValueError()

    def check_token(self, token):
        try:
            username, = self.auth_cursor.execute("select login from credentials where token=?", (token,)).fetchone()
            return {"user": username}
        except sqlite3.OperationalError:
            raise ValueError()

    def stop(self):
        self.auth_db.commit()
        self.auth_db.close()

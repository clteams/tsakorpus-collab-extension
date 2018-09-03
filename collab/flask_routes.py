#!/usr/bin/python3
from flask import jsonify, redirect, render_template, request
import datetime
import json
from .main import *


def make_routes(app):
    @app.route("/collab/authorize.json")
    def collab_authorize():
        if not request.args:
            return jsonify({
                "status": "error",
                "code": "no-arguments",
                "message": "received no arguments"
            })
        else:
            if "login" in request.args and "pwd" in request.args:
                agent = AuthenticationAgent(collab_path)
                try:
                    token = agent.authorize(request.args["login"], request.args["pwd"])
                    agent.stop()
                    resp = app.make_response(redirect('/'))
                    expire_date = datetime.datetime.now()
                    expire_date = expire_date + datetime.timedelta(days=90)
                    resp.set_cookie("user_token", token["token"], expires=expire_date)
                    return resp
                except ValueError as ve:
                    agent.stop()
                    return jsonify({
                        "status": "error",
                        "code": "incorrect-data",
                        "message": str(ve)
                    })
            else:
                return jsonify({
                    "status": "error",
                    "code": "invalid-http-request",
                    "message": "invalid HTTP request"
                })

    @app.route("/collab/addDiff.json", methods=["POST"])
    def collab_add_diff():
        user_token = request.cookies.get("user_token")
        if user_token is None:
            return jsonify({
                "status": "error",
                "code": "user-token-not-found",
                "message": "user token not found"
            })
        if "diff_data" not in request.form:
            return jsonify({
                "status": "error",
                "code": "diff-data-not-found",
                "message": "diff data not found"
            })
        diff_processor = DiffProcessor(user_token, json.loads(request.form["diff_data"]))
        return jsonify(diff_processor.response)

    @app.route("/collab/signin.xml")
    def collab_signin_xml():
        xml_agent = XMLAgent(collab_path)
        if "language" not in request.args:
            return "Invalid request"
        language = request.args["language"]
        language_messages = {
            "en": {
                "authorize_title": "Sign in",
                "login": "User login",
                "password": "Password",
                "authorize": "Authorize"
            },
            "ru": {
                "authorize_title": "Авторизоваться",
                "login": "Имя пользоваться",
                "password": "Пароль",
                "authorize": "Авторизаться"
            },
        }

        if language not in language_messages:
            return "Language is not supported"

        signin_file = xml_agent.open_file("signin.html")
        return signin_file.format(
            authorize_title=language_messages[language]["authorize_title"],
            login=language_messages[language]["login"],
            password=language_messages[language]["password"],
            authorize=language_messages[language]["authorize"]
        )

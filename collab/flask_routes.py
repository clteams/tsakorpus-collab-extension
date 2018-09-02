#!/usr/bin/python3
from flask import redirect, request, jsonify
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
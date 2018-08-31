#!/usr/bin/python3
import json
from .main import *


def make_routes():
    global app, request, jsonify

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
                    token = agent.authorize(request.args["login"], request.args["password"])
                    return jsonify({
                        "status": 200,
                        "login": request.args["login"],
                        "token": token["token"]
                    })
                except ValueError:
                    return jsonify({
                        "status": "error",
                        "code": "incorrect-data",
                        "message": "Login/password is incorrect"
                    })
            else:
                return jsonify({
                    "status": "error",
                    "code": "invalid-http-request",
                    "message": "invalid HTTP request"
                })

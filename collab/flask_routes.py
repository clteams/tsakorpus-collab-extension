#!/usr/bin/python3
from flask import request, jsonify
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
                    return jsonify({
                        "status": 200,
                        "login": request.args["login"],
                        "token": token["token"]
                    })
                except ValueError as ve:
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

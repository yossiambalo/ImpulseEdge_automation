package com.odysii.general;

import org.json.JSONObject;

public class JsonHandler {

    public static JSONObject stringToJson(String jsonText){
        return new JSONObject(jsonText);
    }
}

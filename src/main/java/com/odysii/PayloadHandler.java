package com.odysii;

import org.apache.commons.codec.binary.Base64;

import javax.json.*;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.GZIPInputStream;

public class PayloadHandler {
    private Map<String,String> basket = new HashMap<>();
    private Map<String,String> line;

    private List<Map<String,String>> baskets = new ArrayList<>();
    private List<Map<String,String>> lines = new ArrayList<>();
    private Map<String,String> loyalities = new HashMap<>();
    private Map<String,String> loyality = new HashMap<>();
    private Map<String,String> playedItem;
    private List<Map<String,String>> playedItems = new ArrayList<>();
    private Map<String,String> actions = new HashMap<>();
    private Map<String,String> action = new HashMap<>();
    private List<Map<String,String>> tendrs = new ArrayList<>();
    private List<Map<String,String>> tender = new ArrayList<>();
    private Map<String,String> additionalData = new HashMap<>();
    private JsonObject object;

    public List<Map<String, String>> getPlayedItems() {
        return playedItems;
    }
    public List<Map<String, String>> getBaskets() {
        return baskets;
    }

    public PayloadHandler(String payLoad){
        byte[] decodedBytes = Base64.decodeBase64(payLoad);
        String json = decompress(decodedBytes);
        this.object = getJsonObject(json);
    }

    private JsonObject getJsonObject(String json) {
        JsonReader jsonReader = Json.createReader(new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8)));
        JsonObject object = jsonReader.readObject();
        setBaskets(object.getJsonObject("POS").getJsonArray("Basket"));
        //setPlayedItems(object.getJsonArray("PlayedItems"));
        //setLines(object.getJsonObject("POS").getJsonArray("Lines"));
        jsonReader.close();
        return object;
    }

    private void setPlayedItems(JsonArray jsonArray) {
        Iterator<JsonValue> iterator = jsonArray.iterator();
        while (iterator.hasNext()) {
            playedItem = new HashMap<>();
            JsonObject jsonObject = (JsonObject) iterator.next();
            for (String key : jsonObject.keySet()) {
                if (!"Products".equals(key)) {
                    //System.out.println(key + ":" + jsonObject.get(key));
                    playedItem.put(key, jsonObject.getString(key));
                }
            }
            Iterator<JsonValue> iterator2 = jsonObject.getJsonArray("Products").iterator();
            JsonObject jsonObject2 = (JsonObject) iterator2.next();
            for (String key : jsonObject2.keySet()) {
                //System.out.println(key + ":" + jsonObject2.get(key));
                playedItem.put(key, jsonObject2.getString(key));
            }
            playedItem.putAll(additionalData);
            playedItems.add(playedItem);
        }
    }

    private void setLines(JsonArray jsonArray){
        Iterator<JsonValue> iterator = jsonArray.iterator();
        while (iterator.hasNext()) {
            line = new HashMap<>();
            JsonObject jsonObject = (JsonObject) iterator.next();
            for (String key : jsonObject.keySet()) {
                System.out.println(key + ":" + jsonObject.get(key));
                line.put(key,jsonObject.getString(key));
            }
            lines.add(line);
        }
    }
    private void setBaskets(JsonArray jsonArray){
        Iterator<JsonValue> iterator = jsonArray.iterator();
        while (iterator.hasNext()) {
            basket = new HashMap<>();
            JsonObject jsonObject = (JsonObject) iterator.next();
            for (String key : jsonObject.keySet()) {
                System.out.println(key + ":" + jsonObject.get(key));
                basket.put(key,jsonObject.getString(key));
            }
            baskets.add(basket);
        }
    }
    public static String decompress(byte[] compressed) {
        ByteArrayInputStream bis = new ByteArrayInputStream(compressed);
        StringBuilder sb = null;
        try {
            GZIPInputStream gis = new GZIPInputStream(bis);
            BufferedReader br = new BufferedReader(new InputStreamReader(gis, "UTF-8"));
            sb = new StringBuilder();
            String line;
            while((line = br.readLine()) != null) {
                sb.append(line);
            }
            br.close();
            gis.close();
            bis.close();
        }catch (IOException e){
            System.out.println(e.getMessage());
        }
        return sb.toString();
    }
}

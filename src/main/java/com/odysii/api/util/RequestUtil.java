package com.odysii.api.util;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Map;

public class RequestUtil extends RequestHelper {

    private String token;
    private String url;
    private String mediaType;
    private String res;

    public RequestUtil(String token, String url){
        this.token = token;
        this.url = url;
    }
    public RequestUtil(String token, String url,String mediaType){
        this.token = token;
        this.url = url;
        this.mediaType = mediaType;
    }
    private String getUrl() {
        return url;
    }

    public StringBuffer getRequest(){
        StringBuffer result = new StringBuffer();
        setGetHeaders(token,mediaType);
        try {
            HttpClient client = HttpClientBuilder.create().build();
            HttpGet request = new HttpGet(url);
            for (Map.Entry<String,String> header : getHeaders.entrySet()){
                request.addHeader(header.getKey(),header.getValue());
            }
            BufferedReader rd = null;
            HttpResponse response = client.execute(request);
            if (response.getStatusLine().getStatusCode() != HttpURLConnection.HTTP_OK) {
                throw new RuntimeException("Failed to process request : HTTP error code : "
                        + response.getEntity().getContent());
            }
            rd = new BufferedReader(new InputStreamReader(response.getEntity().getContent()));
            String line = "";
            while ((line = rd.readLine()) != null) {
                result.append(line);
            }
        }catch (MalformedURLException e){
            System.out.println(e.getMessage());
        }catch (IOException e){
            System.out.println(e.getMessage());
        }
        return result;
    }
    public String postRequest(String body){
        HttpURLConnection conn = null;
        setPostHeaders(token,mediaType);
        try {
            URL url = new URL(getUrl());
            conn = (HttpURLConnection) url.openConnection();
            conn.setDoOutput(true);
            conn.setRequestMethod("POST");
            for (Map.Entry<String,String> header : postHeaders.entrySet()){
                conn.setRequestProperty(header.getKey(),header.getValue());
            }
            OutputStream outputStream = conn.getOutputStream();
            outputStream.write(body.getBytes());
            outputStream.flush();
            if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) {
                throw new RuntimeException("Failed to process request : HTTP error code : "
                        + conn.getResponseMessage());
            }
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            String output = "";
            while ((output = bufferedReader.readLine()) != null){
                res = output;
            }
        }catch (MalformedURLException e){
            System.out.println(e.getMessage());
        }catch (IOException e){
            System.out.println(e.getMessage());
        }finally {
            conn.disconnect();
        }
        return res;
    }
    public String deleteRequest(){
        setDeleteHeaders(token,mediaType);
        HttpURLConnection conn = null;
        try {
            URL url = new URL(getUrl());
            conn = (HttpURLConnection) url.openConnection();
            conn.setDoOutput(true);
            conn.setRequestMethod("DELETE");
            for (Map.Entry<String,String> header : deleteHeaders.entrySet()){
                conn.setRequestProperty(header.getKey(),header.getValue());
            }
            OutputStream outputStream = conn.getOutputStream();
            outputStream.flush();
            if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) {
                throw new RuntimeException("Failed to process request : HTTP error code : "
                        + conn.getResponseCode());
            }
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            String output = "";
            while ((output = bufferedReader.readLine()) != null){
                res = output;
            }
        }catch (MalformedURLException e){
            System.out.println(e.getMessage());
        }catch (IOException e){
            System.out.println(e.getMessage());
        }finally {
            conn.disconnect();
        }
        return res;
    }
}

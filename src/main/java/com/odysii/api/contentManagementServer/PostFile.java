package com.odysii.api.contentManagementServer;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.mime.HttpMultipartMode;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;


public class PostFile {

    public static JSONObject uploadFileToServer(String file, String serverUrl){
        File inFile = new File(file);
        FileInputStream fis = null;
        JSONObject jsonObject = null;
        try {
            fis = new FileInputStream(inFile);
            HttpClient client = HttpClientBuilder.create().build();
            HttpPost httppost = new HttpPost(serverUrl);
            MultipartEntityBuilder builder = MultipartEntityBuilder.create();
            builder.setMode(HttpMultipartMode.BROWSER_COMPATIBLE);
            FileBody fileBody = new FileBody(new File(file));
            builder.addPart("file", fileBody);
            HttpEntity entity = builder.build();
            httppost.setEntity(entity);
            HttpResponse response = client.execute(httppost);
            int statusCode = response.getStatusLine().getStatusCode();
            HttpEntity responseEntity = response.getEntity();
            String responseString = EntityUtils.toString(responseEntity, "UTF-8");
            jsonObject = new JSONObject(responseString);
            System.out.println("[" + statusCode + "] " + responseString);
        } catch (ClientProtocolException e) {
            System.err.println("Unable to make connection");
            e.printStackTrace();
        } catch (IOException e) {
            System.err.println("Unable to read file");
            e.printStackTrace();
        } finally {
            try {
                if (fis != null) fis.close();
            } catch (IOException e) {}
        }
        return jsonObject;
    }


}
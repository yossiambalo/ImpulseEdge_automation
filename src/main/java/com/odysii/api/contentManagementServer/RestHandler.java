package com.odysii.api.contentManagementServer;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;




public class RestHandler {

    public static void PostGeneralContent(String url,String body){
        HttpClient httpClient = HttpClientBuilder.create().build(); //Use this instead

        try {

            HttpPost request = new HttpPost(url);
            StringEntity params =new StringEntity(body);
            request.addHeader("content-type", "application/json");
            request.setEntity(params);
            HttpResponse response = httpClient.execute(request);

            System.out.println(response.getStatusLine().getStatusCode());
            System.out.println(response.getEntity().getContent());

        }catch (Exception ex) {



        } finally {

        }
    }

}

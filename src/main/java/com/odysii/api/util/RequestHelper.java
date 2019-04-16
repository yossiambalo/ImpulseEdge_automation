package com.odysii.api.util;

import java.util.HashMap;
import java.util.Map;

public abstract class RequestHelper {

    protected Map<String,String> getHeaders;
    protected Map<String,String> postHeaders;
    protected Map<String,String> deleteHeaders;

    protected void setGetHeaders(String token, String mediaType){
        getHeaders = new HashMap<>();
        getHeaders.put("Authorization",token);
        getHeaders.put("Content-Type",mediaType);
    }

    protected void setPostHeaders(String token, String mediaType){
        postHeaders = new HashMap<>();
        postHeaders.put("Authorization",token);
        postHeaders.put("Content-Type", mediaType);
    }
    protected void setDeleteHeaders(String token, String mediaType){
        deleteHeaders = new HashMap<>();
        deleteHeaders.put("Authorization",token);
        deleteHeaders.put("Content-Type", mediaType);
    }
}

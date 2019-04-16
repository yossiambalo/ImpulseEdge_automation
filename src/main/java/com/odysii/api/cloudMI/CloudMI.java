package com.odysii.api.cloudMI;

import com.odysii.api.MediaType;
import com.odysii.api.util.RequestUtil;
import com.odysii.general.JsonHandler;
import com.odysii.general.PropertyLoader;
import org.json.JSONObject;

import java.util.Properties;

public abstract class CloudMI {

    protected String token, cloudMIUri, projectID;
    protected CloudMIUser cloudMIUser;
    private String subUrl;

    protected void init(String subUrl){
        PropertyLoader propertyLoader = new PropertyLoader();
        Properties properties = propertyLoader.loadPropFile("cloud_mi.properties");
        token = properties.getProperty("token");
        cloudMIUri = properties.getProperty("coloudMI_uri");
        projectID = properties.getProperty("project_id");
        cloudMIUser = new CloudMIUser(properties.getProperty("user_name"));
        this.subUrl = subUrl;
    }
    public JSONObject createPlacement(){
        Placement placement = new Placement();
        String url = cloudMIUri+ subUrl +placement.getCreateRoute() +"?ProjectId="+projectID+"&UserEmail="+cloudMIUser.getUserEmail();
        RequestUtil requestUtil = new RequestUtil(token,url, MediaType.APPLICATION_JSON);
        String result = requestUtil.postRequest(placement.getBody());

        return JsonHandler.stringToJson(result);
    }
    public JSONObject createPlacement(String placementProp){
        Placement placement = new Placement(placementProp);
        String url = cloudMIUri+ subUrl +placement.getCreateRoute() +"?ProjectId="+projectID+"&UserEmail="+cloudMIUser.getUserEmail();
        RequestUtil requestUtil = new RequestUtil(token,url, MediaType.APPLICATION_JSON);
        String result = requestUtil.postRequest(placement.getBody());

        return JsonHandler.stringToJson(result);
    }
    public JSONObject linkPlacement(String contentID,String placementID){
        Placement placement = new Placement();
        String url = cloudMIUri+ subUrl +"/"+contentID+placement.getAddRoute() +"?ProjectId="+projectID+"&placement_id="+placementID+"&UserEmail="+cloudMIUser.getUserEmail();
        RequestUtil requestUtil = new RequestUtil(token,url, MediaType.APPLICATION_X_URL_ENCODED);
        StringBuffer result = requestUtil.getRequest();

        return JsonHandler.stringToJson(result.toString());
    }
    public JSONObject unlinkPlacement(String contentID,String placementID){
        Placement placement = new Placement();
        String url = cloudMIUri+ subUrl +"/"+contentID+placement.getUnlinkPlacement() +"?ProjectId="+projectID+"&placement_id="+placementID+"&UserEmail="+cloudMIUser.getUserEmail();
        RequestUtil requestUtil = new RequestUtil(token,url, MediaType.APPLICATION_X_URL_ENCODED);
        StringBuffer result = requestUtil.getRequest();

        return JsonHandler.stringToJson(result.toString());
    }
    public JSONObject deletePlacement(String placementID){
        Placement placement = new Placement();
        String url = cloudMIUri+ subUrl +placement.getDeletePlacementRoute() +"?ProjectId="+projectID+"&placement_id="+placementID+"&UserEmail="+cloudMIUser.getUserEmail();
        RequestUtil requestUtil = new RequestUtil(token,url, MediaType.APPLICATION_X_URL_ENCODED);
        String result = requestUtil.deleteRequest();
        return JsonHandler.stringToJson(result);
    }
}

package com.odysii.selenium;

import com.odysii.general.PropertyLoader;
import com.odysii.selenium.helper.BasePageObject;
import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import java.util.Properties;

public class ImpulseEdge extends BasePageObject{

    @FindBy(id = "com.gilbarco.impulseedge.debug:id/settings_button")
    private WebElement settingsBtn;
    @FindBy(id = "com.gilbarco.impulseedge.debug:id/project_id_text")
    private WebElement projectIdTxt;
    @FindBy(id = "com.gilbarco.impulseedge.debug:id/project_token_text")
    private WebElement projectTokenTxt;
    @FindBy(id = "com.gilbarco.impulseedge.debug:id/channel_id_text")
    private WebElement channelIdTxt;
    @FindBy(id = "com.gilbarco.impulseedge.debug:id/server_url_text")
    private WebElement serverUrlTxt;
    @FindBy(id = "com.gilbarco.impulseedge.debug:id/done_button")
    private WebElement doneBtn;
    @FindBy(id = "com.gilbarco.impulseedge.debug:id/start_impulse_button")
    private WebElement startImpuleBtn;

    public ImpulseEdge(AndroidDriver driver) {
        super(driver);
    }

    public void startApp(){
        PropertyLoader propertyLoader = new PropertyLoader();
        Properties properties = propertyLoader.loadPropFile("impulse_edge.properties");
        settingsBtn.click();
        isElementPresent(projectIdTxt);
        projectIdTxt.clear();
        projectIdTxt.sendKeys(properties.getProperty("project_id"));
        projectTokenTxt.clear();
        projectTokenTxt.sendKeys(properties.getProperty("project_token"));
        channelIdTxt.clear();
        channelIdTxt.sendKeys(properties.getProperty("channel_id"));
        serverUrlTxt.clear();
        serverUrlTxt.sendKeys(properties.getProperty("server_url"));
        doneBtn.click();
        isElementPresent(startImpuleBtn);
        startImpuleBtn.click();
    }
}

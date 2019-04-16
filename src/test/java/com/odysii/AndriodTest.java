package com.odysii;

import com.odysii.api.contentManagementServer.RestHandler;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.service.local.AppiumDriverLocalService;
import org.json.JSONObject;
import org.openqa.selenium.By;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeSuite;
import org.testng.annotations.Test;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

import static com.odysii.api.contentManagementServer.PostFile.uploadFileToServer;

public class AndriodTest {
    public AndroidDriver driver;
    public WebDriverWait wait;
    AppiumDriverLocalService appiumService;
    String appiumServiceUrl;
    private final String killEmulatorCmd = "adb -s emulator-5554 emu kill";

    @BeforeSuite
    public void beforeSuite(){
        String url = "http://odysii-lcl.gilbarco.com:8090/content-server/GeneralContent/1367";
        JSONObject resResource = uploadFileToServer("C:\\pb\\yossi\\app.jpg","http://odysii-lcl.gilbarco.com:8090/content-server/Storage");
        System.out.println(resResource);
        JSONObject newResource = new JSONObject();
        newResource.put("new_resource",resResource.get("fileName"));
        newResource.put("new_link",resResource.get("url"));
        newResource.put("new_hash",resResource.get("hash"));
        String body = "{\"backgroundColor\": \"#f6da77\",\"imageFillColor\": \"\",\"name\": \"Ticker_TEST\",\"storeLogo\": {\"new_resource\": \"1555310360018-arthur.jpg\",\"new_link\": \"https://cloudmi-qa.s3.amazonaws.com/contentApp/TempMedia/1555310360018-arthur.jpg\",\"new_hash\": \"30f4db1a5e2b936acc84e6b237d861a2\"},\"TickerMessages\": [{\"content\": \"This is a test ticker\"}],\"textColor\": \"#2fa9b0\",\"textBorderColor\": \"\"}";
        JSONObject tickerJson = new JSONObject(body);
        tickerJson.put("storeLogo",newResource);
        System.out.println(tickerJson);
        RestHandler restHandler = new RestHandler();
        restHandler.PostGeneralContent(url,tickerJson.toString());

    }

    @BeforeClass
    public void setup () throws MalformedURLException {
        String emulatorPath = "emulator -avd Nexus_5X_API_28_2";//"C:\\Users\\nir.sarusy\\AppData\\Local\\Android\\Sdk\\emulator\\emulator.exe";
        runCmd(emulatorPath);
        appiumService = AppiumDriverLocalService.buildDefaultService();
        appiumService.start();
        appiumServiceUrl = appiumService.getUrl().toString();
        System.out.println("Appium Service Address : - "+ appiumServiceUrl);
        DesiredCapabilities caps = new DesiredCapabilities();
        //caps.setCapability("deviceName", "Lenovo TAB 10.1 API 24");
        caps.setCapability("deviceName", "Nexus_5X_API_28_2");
        caps.setCapability("uuid", "emulator-5554");
        caps.setCapability("platformName", "Android");
        caps.setCapability("platformVersion", "9");
        caps.setCapability("skipUnlock","false");
        caps.setCapability("appPackage", "com.android.calculator2");
        caps.setCapability("appActivity","com.android.calculator2.Calculator");
        caps.setCapability("noReset","false");
        driver = new AndroidDriver(new URL(appiumServiceUrl), caps);
        wait = new WebDriverWait(driver, 10);
    }

    @Test
    public void _01_TestSuccess() {
        System.out.println("Calculate sum of two numbers - Example of successful test");
        wait.until(ExpectedConditions.visibilityOfElementLocated
                (By.id("com.android.calculator2:id/pad_numeric"))).isDisplayed();
        driver.findElement(By.id("com.android.calculator2:id/digit_2")).click();
        driver.findElement(By.id("com.android.calculator2:id/op_add")).click();
        driver.findElement(By.id("com.android.calculator2:id/digit_2")).click();
        driver.findElement(By.id("com.android.calculator2:id/eq")).click();
        String actualResults = driver.findElement(By.id("com.android.calculator2:id/result")).getText();
        System.out.println(actualResults);
        String expectedResult = "4";
        Assert.assertEquals(actualResults,expectedResult);


    }

    @Test
    public void _02_TestFail() {
        System.out.println("Calculate multiple of two numbers - Example of failing test");
        wait.until(ExpectedConditions.visibilityOfElementLocated
                (By.id("com.android.calculator2:id/pad_numeric"))).isDisplayed();
        driver.findElement(By.id("com.android.calculator2:id/digit_2")).click();
        driver.findElement(By.id("com.android.calculator2:id/op_mul")).click();
        driver.findElement(By.id("com.android.calculator2:id/digit_8")).click();
        driver.findElement(By.id("com.android.calculator2:id/eq")).click();
        String actualResults = driver.findElement(By.id("com.android.calculator2:id/result")).getText();
        System.out.println(actualResults);
        String expectedResult = "17";
        Assert.assertEquals(actualResults,expectedResult);


    }
    @AfterClass
    public void teardown(){
        driver.quit();
        appiumService.stop();
        runCmd(killEmulatorCmd);
    }

    private void runCmd(String command){
        try {
            Runtime.getRuntime().exec("cmd.exe /c "+command);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

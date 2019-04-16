package com.odysii.appium;
import org.apache.commons.io.FileUtils;
import org.openqa.selenium.OutputType;
import io.appium.java_client.android.AndroidDriver;

import java.io.File;
import java.io.IOException;

public class ScreenshotTake {

    public AndroidDriver driver;

    public ScreenshotTake (AndroidDriver driver) {
        this.driver = driver;

    }

    public void takeScreenshot(File path_screenshot) throws IOException {
        File srcFile = driver.getScreenshotAs(OutputType.FILE);
        String filename = "\\Screenshot1";
        File targetFile = new File(path_screenshot + filename + ".jpg");
        FileUtils.copyFile(srcFile, targetFile);
    }
}

package com.odysii;

import com.odysii.selenium.ImpulseEdge;
import org.testng.Assert;
import org.testng.annotations.Test;

public class ImpulseEdgeTest extends TestBase {

    @Test
    public void openEdge(){
        ImpulseEdge impulseEdge = new ImpulseEdge(driver);
        impulseEdge.startApp();
        Assert.assertTrue(true);

    }
}

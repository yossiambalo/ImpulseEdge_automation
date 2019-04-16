package com.odysii.general;

import javax.xml.bind.annotation.*;
import java.util.List;

@XmlRootElement(name="configuration")
@XmlAccessorType(XmlAccessType.FIELD)
public class CncManager {

    @XmlElementWrapper(name="TVZXMLSection")
    @XmlElement(name="Config")
    private List<Config> configs;

    public List<Config> getConfigs() {
        return configs;
    }

    public static class Config{

        @XmlElement(name="ChannelID")
        private String channelID;

        public void setChannelID(String channelID) {
            this.channelID = channelID;
        }
    }
}

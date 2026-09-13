package com.edunova.notificationservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration",
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
class NotificationServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}

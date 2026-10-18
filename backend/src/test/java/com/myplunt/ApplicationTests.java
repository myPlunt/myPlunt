package com.myplunt;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
@TestPropertySource(properties = {
		"app.jwt.secret=test-only-secret-test-only-secret-32b",
		"app.admin.jwt.secret=test-only-admin-secret-test-only-admin-32b",
		"app.storage.endpoint=http://localhost:9000",
		"app.storage.bucket=myplunt-test",
		"app.storage.access-key=test",
		"app.storage.secret-key=test"
})
class ApplicationTests {

	@Container
	@ServiceConnection
	static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

	@Test
	void contextLoads() {
	}

}

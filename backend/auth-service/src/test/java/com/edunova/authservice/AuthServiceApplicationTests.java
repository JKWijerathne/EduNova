package com.edunova.authservice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:edunova_auth_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
@AutoConfigureMockMvc
class AuthServiceApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void contextLoads() {
    }

    @Test
    void profileEndpointsRequireJwtAndOnlyExposeOrUpdateTheAuthenticatedUsersProfile() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        String studentToken = registerAndGetToken("Student", "student-profile@example.com", "STUDENT");
        String adminToken = registerAndGetToken("Admin", "admin-profile@example.com", "ADMIN");

        MvcResult studentUpdate = mockMvc.perform(patch("/api/auth/me")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Updated Student\",\"phoneNumber\":\"+1 (212) 555-0199\",\"role\":\"ADMIN\",\"email\":\"other@example.com\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode studentProfile = objectMapper.readTree(studentUpdate.getResponse().getContentAsString());
        assertThat(studentProfile.get("name").asText()).isEqualTo("Updated Student");
        assertThat(studentProfile.get("phoneNumber").asText()).isEqualTo("+1 (212) 555-0199");
        assertThat(studentProfile.get("email").asText()).isEqualTo("student-profile@example.com");
        assertThat(studentProfile.get("role").asText()).isEqualTo("STUDENT");
        assertThat(studentProfile.has("password")).isFalse();
        assertThat(studentProfile.has("token")).isFalse();

        MvcResult refreshedStudentResponse = mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode refreshedStudentProfile = objectMapper.readTree(refreshedStudentResponse.getResponse().getContentAsString());
        assertThat(refreshedStudentProfile.get("name").asText()).isEqualTo("Updated Student");
        assertThat(refreshedStudentProfile.get("phoneNumber").asText()).isEqualTo("+1 (212) 555-0199");

        mockMvc.perform(patch("/api/auth/me")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Updated Student\",\"phoneNumber\":\"not-a-phone\"}"))
                .andExpect(status().isBadRequest());

        MvcResult adminResponse = mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode adminProfile = objectMapper.readTree(adminResponse.getResponse().getContentAsString());
        assertThat(adminProfile.get("name").asText()).isEqualTo("Admin");
        assertThat(adminProfile.get("role").asText()).isEqualTo("ADMIN");

        mockMvc.perform(patch("/api/auth/me/2")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Changed another account\"}"))
                .andExpect(status().isNotFound());
    }

    private String registerAndGetToken(String name, String email, String role) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegistrationRequest(name, email, "test-password-123", role))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private record RegistrationRequest(String name, String email, String password, String role) {
    }
}

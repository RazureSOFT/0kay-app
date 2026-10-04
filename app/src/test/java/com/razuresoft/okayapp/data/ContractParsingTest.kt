package com.razuresoft.okayapp.data

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ContractParsingTest {
    @Test
    fun `agent options parse from strings or objects`() {
        val list = JsonArray(listOf(
            JsonPrimitive("重启"),
            JsonObject(mapOf("label" to JsonPrimitive("继续"))),
            JsonObject(mapOf("text" to JsonPrimitive("取消"))),
            JsonNull,
        ))
        val labels = list.map { it.agentOptionLabel() }
        assertEquals(listOf("重启", "继续", "取消", ""), labels)
    }

    @Test
    fun `notification ownership follows the exact session id`() {
        val mine = JsonObject(mapOf("session_id" to JsonPrimitive("app:abc")))
        val other = JsonObject(mapOf("session_id" to JsonPrimitive("webui:abc")))
        val legacy = JsonObject(emptyMap())
        assertTrue(mine.notificationBelongsTo("app:abc"))
        assertFalse(other.notificationBelongsTo("app:abc"))
        assertTrue(legacy.notificationBelongsTo("app:abc"))
    }
}

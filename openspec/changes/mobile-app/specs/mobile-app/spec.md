---
title: "mobile-app Specification"
change: mobile-app
phase: spec
artifact: spec
capability: mobile-app
status: draft
---

# Delta for mobile-app

## Purpose

App Expo/RN para usar Mensajería desde mobile con Tamagui, React Navigation v7, Axios y SecureStore.

## ADDED Requirements

### Requirement: Auth shell and navigation

The app MUST use an unauthenticated auth stack and an authenticated tab shell. Protected screens MUST remain unreachable without a valid session.

#### Scenario: Cold start without session
- GIVEN no valid session
- WHEN the app starts
- THEN the auth stack is shown and protected tabs are hidden

#### Scenario: Cold start with session
- GIVEN a valid session
- WHEN the app starts
- THEN the inbox tab is shown

### Requirement: Session persistence, refresh, and logout

The app MUST persist auth state locally, refresh access tokens when needed, and clear credentials on logout.

#### Scenario: Login stores session
- GIVEN valid credentials
- WHEN the user logs in
- THEN auth data is stored and inbox opens

#### Scenario: Refresh restores session
- GIVEN an expired access token and valid refresh token
- WHEN the app refreshes
- THEN a new access token is obtained without re-login

#### Scenario: Logout clears session
- GIVEN an authenticated user
- WHEN the user logs out
- THEN local auth data is removed and auth screens return

### Requirement: Inbox and sent lists

The app MUST show paginated inbox and sent lists with sender, subject, and sentAt metadata.

#### Scenario: Load inbox page
- GIVEN inbox messages exist
- WHEN the inbox opens
- THEN the first page is rendered

#### Scenario: Load next inbox page
- GIVEN more inbox pages exist
- WHEN the user requests more
- THEN the next page is appended

#### Scenario: Empty sent list
- GIVEN no sent messages
- WHEN the sent tab opens
- THEN an empty state is shown

### Requirement: Compose and send

The app MUST allow composing and sending a new message from the compose screen.

#### Scenario: Send new message
- GIVEN recipients, subject, and body are filled
- WHEN the user taps send
- THEN the message is created and the screen closes

#### Scenario: Reject empty recipients
- GIVEN no recipients selected
- WHEN the user taps send
- THEN the app blocks submission

### Requirement: Message detail and thread view

The app MUST show message detail and thread history for accessible messages, and allow reply from detail.

#### Scenario: Open detail
- GIVEN a message in inbox or sent
- WHEN the user opens it
- THEN sender, body, recipients, and sentAt are shown

#### Scenario: Open thread and reply
- GIVEN a threaded message
- WHEN the user opens thread and replies
- THEN the full chain is shown and the reply is created

### Requirement: Search

The app MUST search the user's messages and show paginated relevance-ranked results.

#### Scenario: Search returns matches
- GIVEN a non-empty query with matches
- WHEN the user searches
- THEN accessible messages are listed

#### Scenario: Empty query is rejected
- GIVEN an empty query
- WHEN the user searches
- THEN the app blocks the request

### Requirement: Drafts CRUD

The app MUST list, edit, send, and discard the user's drafts.

#### Scenario: Edit draft
- GIVEN an existing draft
- WHEN the user edits and saves it
- THEN the changes persist

#### Scenario: Send draft
- GIVEN a draft with recipients
- WHEN the user sends it
- THEN the draft is removed and a message is created

### Requirement: Groups list and detail

The app MUST list the user's groups and show group detail with members.

#### Scenario: List groups
- GIVEN the user belongs to groups
- WHEN the groups screen opens
- THEN only visible groups are shown

#### Scenario: Open group detail
- GIVEN a visible group
- WHEN the user opens it
- THEN the group and members are shown

### Requirement: Pinned messages

The app MUST show pinned messages and allow pin/unpin from accessible message views.

#### Scenario: List pinned messages
- GIVEN pinned messages exist
- WHEN the pinned screen opens
- THEN the pinned list is rendered

#### Scenario: Toggle pin state
- GIVEN an accessible message
- WHEN the user pins or unpins it
- THEN the pin state changes immediately

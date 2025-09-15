# Requirements Document

## Introduction

Create a Cursor-like interface where users can view their GitHub repository code on the left side and chat about it with AI on the right side. This provides a seamless code analysis experience similar to Cursor's interface.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to see my GitHub repository files on the left and chat about them on the right, so that I can analyze my code like in Cursor.

#### Acceptance Criteria

1. WHEN I open the chat page THEN I SHALL see a split layout with file explorer on the left and chat on the right
2. WHEN I select a GitHub repository THEN the file tree SHALL appear on the left side
3. WHEN I click on a file THEN it SHALL open in a code viewer on the left
4. WHEN I ask questions in the chat THEN the AI SHALL reference the currently open file

### Requirement 2

**User Story:** As a developer, I want to browse my GitHub repository files in a tree structure, so that I can easily navigate and select files to discuss.

#### Acceptance Criteria

1. WHEN a repository is connected THEN I SHALL see a collapsible file tree on the left
2. WHEN I expand folders THEN I SHALL see the contained files and subfolders
3. WHEN I click on a file THEN it SHALL display the file content with syntax highlighting
4. WHEN I select different files THEN the chat context SHALL update to reference the current file

### Requirement 3

**User Story:** As a developer, I want the AI to understand which file I'm currently viewing, so that it can provide relevant answers about that specific code.

#### Acceptance Criteria

1. WHEN I have a file open THEN the AI SHALL know the current file context
2. WHEN I ask "what does this function do" THEN the AI SHALL analyze the currently open file
3. WHEN I ask about specific lines THEN the AI SHALL reference the visible code
4. WHEN I switch files THEN the AI context SHALL automatically update
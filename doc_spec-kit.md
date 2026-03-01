A🤔 What is Spec-Driven Development?
Spec-Driven Development flips the script on traditional software development. For decades, code has been king — specifications were just scaffolding we built and discarded once the "real work" of coding began. Spec-Driven Development changes this: specifications become executable, directly generating working implementations rather than just guiding them.

⚡ Get Started
1. Install Specify CLI
Choose your preferred installation method:

Option 1: Persistent Installation (Recommended)
Install once and use everywhere:

uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
Then use the tool directly:

# Create new project
specify init <PROJECT_NAME>

# Or initialize in existing project
specify init . --ai claude
# or
specify init --here --ai claude

# Check installed tools
specify check
To upgrade Specify, see the Upgrade Guide for detailed instructions. Quick upgrade:

uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git
Option 2: One-time Usage
Run directly without installing:

uvx --from git+https://github.com/github/spec-kit.git specify init <PROJECT_NAME>
Benefits of persistent installation:

Tool stays installed and available in PATH
No need to create shell aliases
Better tool management with uv tool list, uv tool upgrade, uv tool uninstall
Cleaner shell configuration
2. Establish project principles
Launch your AI assistant in the project directory. The /speckit.* commands are available in the assistant.

Use the /speckit.constitution command to create your project's governing principles and development guidelines that will guide all subsequent development.

/speckit.constitution Create principles focused on code quality, testing standards, user experience consistency, and performance requirements
3. Create the spec
Use the /speckit.specify command to describe what you want to build. Focus on the what and why, not the tech stack.

/speckit.specify Build an application that can help me organize my photos in separate photo albums. Albums are grouped by date and can be re-organized by dragging and dropping on the main page. Albums are never in other nested albums. Within each album, photos are previewed in a tile-like interface.
4. Create a technical implementation plan
Use the /speckit.plan command to provide your tech stack and architecture choices.

/speckit.plan The application uses Vite with minimal number of libraries. Use vanilla HTML, CSS, and JavaScript as much as possible. Images are not uploaded anywhere and metadata is stored in a local SQLite database.
5. Break down into tasks
Use /speckit.tasks to create an actionable task list from your implementation plan.

/speckit.tasks
6. Execute implementation
Use /speckit.implement to execute all tasks and build your feature according to the plan.

/speckit.implement
For detailed step-by-step instructions, see our comprehensive guide.



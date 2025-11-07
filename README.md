# AgenticDaprDemoAspire

An agentic AI system built with .NET Aspire, Dapr, and various AI agents working together in a distributed architecture.

## Project Structure

This repository contains multiple microservices and components:

- **AgenticDaprDemoAspire.AppHost**: .NET Aspire host application
- **AgenticDaprDemoAspire.ServiceDefaults**: Shared service defaults
- **Chainlit**: Chat interface for user interactions
- **Elf/**: Legolas agent service (FastAPI)
- **Hobbit/**: Frodo agent service (FastAPI)  
- **Wizard/**: Gandalf agent service (FastAPI)
- **WorkflowLLM/**: LLM Orchestrator service (FastAPI)
- **keystone_poc/**: Angular frontend application

## Prerequisites

- .NET 8 SDK
- Python 3.8+
- Node.js and npm
- Docker Desktop
- Dapr CLI

## Setup Instructions

### 1. Environment Variables

Each service requires an OpenAI API key. Copy the `.env.example` files to `.env` files and add your API key:

```bash
# In each service directory (Chainlit, Elf, Hobbit, Wizard, WorkflowLLM)
cp .env.example .env
# Then edit each .env file to add your OpenAI API key
```

### 2. Install Dependencies

**Python Services:**
```bash
# Install dependencies for each Python service
cd Chainlit && pip install -r requirements.txt
cd ../Elf && pip install -r requirements.txt  
cd ../Hobbit && pip install -r requirements.txt
cd ../Wizard && pip install -r requirements.txt
cd ../WorkflowLLM && pip install -r requirements.txt
```

**Angular Frontend:**
```bash
cd keystone_poc
npm install
```

**Node.js Server:**
```bash
cd keystone_poc/server
npm install
```

### 3. Running the Application

**Using .NET Aspire (Recommended):**

### Add openai api key to .env files
```bash
cd ../Elf/.env
cd ../Hobbit/.env
cd ../Wizard/.env
cd ../WorkflowLLM/.env
```
### Update WorkflowLLM\server.py on line 112 with the absolute path of LLMOrchestrator_state.json
```bash
LLM_STATE_PATH = r"C:\Users\kouly\Downloads\agenticdemo-lordofrings2\AgenticDaprDemoAspire\WorkflowLLM\LLMOrchestrator_state.json"

```

```bash
cd AgenticDaprDemoAspire.AppHost
dotnet run
```

**Or run individual services:**

```bash
# Terminal 1 - WorkflowLLM
cd WorkflowLLM
python server.py

# Terminal 2 - Elf Agent  
cd Elf
python server.py

# Terminal 3 - Hobbit Agent
cd Hobbit  
python server.py

# Terminal 4 - Wizard Agent
cd Wizard
python server.py

# Terminal 5 - Chainlit UI
cd Chainlit
chainlit run app.py

# Terminal 6 - Angular Frontend
cd keystone_poc
npm start
```

## Architecture

This system demonstrates an agentic AI architecture where:

1. **LLM Orchestrator** coordinates between different AI agents
2. **Individual Agents** (Elf, Hobbit, Wizard) handle specific tasks
3. **Dapr** provides service-to-service communication and state management
4. **Chainlit** provides a chat interface for user interactions
5. **Angular frontend** provides a web interface
6. **.NET Aspire** orchestrates the entire system

## Configuration

The system uses Dapr components for:
- State management (Redis)
- Pub/Sub messaging  
- Service invocation
- Configuration management

Dapr components are configured in the `AgenticDaprDemoAspire.AppHost/dapr_components/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

See individual service directories for license information.
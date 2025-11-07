using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;

using CommunityToolkit.Aspire.Hosting.Dapr;
//using Aspire.Hosting.no;
var builder = DistributedApplication.CreateBuilder(args);


DaprSidecarOptions sideCarAgenticDaprDemo = new()
{
    AppId = "apiservice",
    LogLevel = "debug",
    ResourcesPaths = ["dapr_components"],
    DaprGrpcPort = 50006,
    DaprHttpPort = 3501,
    
};


var elf = builder.AddExecutable(
    "Elf",
    Path.Combine("..", "Elf", "run-fastapi.bat"),
    "" // No arguments needed  
)
.WithDaprSidecar(new DaprSidecarOptions
{
    AppId = "elf",
    LogLevel = "debug",
    ResourcesPaths = ["dapr_components"],
    DaprGrpcPort = 50007,
    DaprHttpPort = 3502,
    
});

var wizard = builder.AddExecutable(
    "Wizard",
    Path.Combine("..", "Wizard", "run-fastapi.bat"),
    "" // No arguments needed  
)
.WithDaprSidecar(new DaprSidecarOptions
{
    AppId = "wizard",
    LogLevel = "debug",
    ResourcesPaths = ["dapr_components"],
    DaprGrpcPort = 50008,
    DaprHttpPort = 3503,
    
});

var hobbit = builder.AddExecutable(
    "Hobbit",
    Path.Combine("..", "Hobbit", "run-fastapi.bat"),
    "" // No arguments needed  
)
.WithDaprSidecar(new DaprSidecarOptions
{
    AppId = "hobbit",
    LogLevel = "debug",
    ResourcesPaths = ["dapr_components"],
    DaprGrpcPort = 50009,
    DaprHttpPort = 3504,
    
});

var workflow = builder.AddExecutable(
    "WorkflowLLM",
    Path.Combine("..", "WorkflowLLM", "run-fastapi.bat"),
    "" // No arguments needed  
)
.WithDaprSidecar(new DaprSidecarOptions
{
    AppId = "workflow",
    LogLevel = "debug",
    ResourcesPaths = ["dapr_components"],
    DaprGrpcPort = 50005,
    DaprHttpPort = 3505,
    MetricsPort = 9093
});

//var mcpserver = builder.AddExecutable(
//    "MCPServer",
//    Path.Combine("..", "MCPServer", "run-fastapi.bat"),
//    "" // No arguments needed  
//)
//.WithDaprSidecar(new DaprSidecarOptions
//{
//    AppId = "mcpserver",
//    LogLevel = "debug",
//    ResourcesPaths = ["dapr_components"],
//    DaprGrpcPort = 50004,
//    DaprHttpPort = 3506,

//});

//var weather = builder.AddProject<Projects.WeatherService_API>("Weather-api")
//.WithDaprSidecar(new DaprSidecarOptions
//{
//    AppId = "weather",
//    LogLevel = "debug",
//    ResourcesPaths = ["dapr_components"],
//    DaprGrpcPort = 50003,
//    DaprHttpPort = 3507,

//});

//var filePathChainlit = Path.Combine("..", "Chainlit", "run-chainlit.bat");

//var chainlit = builder.AddExecutable(
//    "Chainlit",
//    filePathChainlit,
//    "" // No arguments needed  
//);
builder.AddNpmApp("KeystonePoc", Path.Combine("..", "keystone_poc"), "start")
    .WithHttpEndpoint(targetPort: 4200, name: "frontend")
    .WithHttpEndpoint(targetPort: 8010, name: "backend");
  

//builder.AddProject<Projects.WeatherService_API>("weatherservice-api");

//builder.AddProject<Projects.MCPServer>("mcpserver");


builder.Build().Run();

// Program.cs - Application-wide spinner configuration
builder.Services.AddScoped<LoadingService>(provider => 
{
    var config = builder.Configuration.GetSection("LoadingSpinner");
    var service = new LoadingService();
    
    // Configure default messages from appsettings.json
    var defaultMessage = config["DefaultMessage"] ?? "Loading...";
    var defaultSubMessage = config["DefaultSubMessage"] ?? "Please wait";
    
    return service;
});

// Or use the configurable service
builder.Services.AddScoped<ConfigurableLoadingService>(provider =>
{
    var service = new ConfigurableLoadingService();
    var config = builder.Configuration.GetSection("LoadingSpinner");
    
    // Configure default theme
    var theme = Enum.TryParse<ConfigurableLoadingService.SpinnerTheme>(
        config["DefaultTheme"], out var parsedTheme) ? parsedTheme : 
        ConfigurableLoadingService.SpinnerTheme.Default;
        
    service.Configure(theme);
    return service;
});
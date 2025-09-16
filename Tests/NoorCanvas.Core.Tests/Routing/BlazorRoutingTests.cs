using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NoorCanvas.Pages;
using System.Reflection;
using Xunit;
using Xunit.Abstractions;

namespace NoorCanvas.Core.Tests.Routing
{
    /// <summary>
    /// Test cases for Issue-18: Blazor Routing Navigation Failure
    /// and Issue-19: Ambiguous Route Conflict Between Index and Landing Pages
    /// 
    /// These tests validate that:
    /// 1. No ambiguous route conflicts exist between pages
    /// 2. Index.razor correctly routes to /home only
    /// 3. HostLanding.razor correctly handles root route / and /landing
    /// 4. Application can start without routing exceptions
    /// </summary>
    public class BlazorRoutingTests
    {
        private readonly ITestOutputHelper _output;

        public BlazorRoutingTests(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void Issue18_IndexPage_ShouldOnlyRouteToHome()
        {
            // Arrange
            var indexPageType = typeof(NoorCanvas.Pages.Index);
            var routeAttributes = indexPageType.GetCustomAttributes<RouteAttribute>();

            // Act
            var routes = routeAttributes.Select(r => r.Template).ToList();

            // Assert
            Assert.Single(routes);
            Assert.Contains("/home", routes);
            Assert.DoesNotContain("/", routes);

            _output.WriteLine($"✅ Issue-18 Test Passed: Index.razor routes only to /home");
            _output.WriteLine($"   Routes found: {string.Join(", ", routes)}");
        }

        [Fact]
        public void Issue18_LandingPage_ShouldRouteToRootAndLanding()
        {
            // Arrange
            var landingPageType = typeof(Landing);
            var routeAttributes = landingPageType.GetCustomAttributes<RouteAttribute>();

            // Act
            var routes = routeAttributes.Select(r => r.Template).ToList();

            // Assert
            Assert.Contains("/", routes);
            Assert.Contains("/landing", routes);
            Assert.Equal(2, routes.Count);

            _output.WriteLine($"✅ Issue-18 Test Passed: HostLanding.razor handles root route and /landing");
            _output.WriteLine($"   Routes found: {string.Join(", ", routes)}");
        }

        [Fact]
        public void Issue19_NoAmbiguousRoutes_ShouldNotHaveDuplicateRootRoutes()
        {
            // Arrange
            var assembly = typeof(Program).Assembly;
            var componentTypes = assembly.GetTypes()
                .Where(t => t.IsSubclassOf(typeof(ComponentBase)))
                .ToList();

            // Act
            var routeMap = new Dictionary<string, List<Type>>();
            
            foreach (var componentType in componentTypes)
            {
                var routeAttributes = componentType.GetCustomAttributes<RouteAttribute>();
                foreach (var routeAttribute in routeAttributes)
                {
                    var route = routeAttribute.Template;
                    if (!routeMap.ContainsKey(route))
                        routeMap[route] = new List<Type>();
                    routeMap[route].Add(componentType);
                }
            }

            // Assert - No route should have multiple components
            var ambiguousRoutes = routeMap.Where(kvp => kvp.Value.Count > 1).ToList();
            
            Assert.Empty(ambiguousRoutes);

            _output.WriteLine($"✅ Issue-19 Test Passed: No ambiguous routes detected");
            _output.WriteLine($"   Total unique routes: {routeMap.Count}");
            
            if (ambiguousRoutes.Any())
            {
                foreach (var ambiguous in ambiguousRoutes)
                {
                    _output.WriteLine($"❌ Ambiguous route '{ambiguous.Key}' in components: {string.Join(", ", ambiguous.Value.Select(t => t.Name))}");
                }
            }
        }

        [Fact]
        public void Issue19_RootRoute_ShouldOnlyBeMappedToLandingPage()
        {
            // Arrange
            var assembly = typeof(Program).Assembly;
            var componentTypes = assembly.GetTypes()
                .Where(t => t.IsSubclassOf(typeof(ComponentBase)))
                .ToList();

            // Act
            var rootRouteComponents = new List<Type>();
            
            foreach (var componentType in componentTypes)
            {
                var routeAttributes = componentType.GetCustomAttributes<RouteAttribute>();
                foreach (var routeAttribute in routeAttributes)
                {
                    if (routeAttribute.Template == "/")
                    {
                        rootRouteComponents.Add(componentType);
                    }
                }
            }

            // Assert
            Assert.Single(rootRouteComponents);
            Assert.Equal(typeof(Landing), rootRouteComponents.First());

            _output.WriteLine($"✅ Issue-19 Test Passed: Root route (/) only mapped to Landing page");
            _output.WriteLine($"   Root route component: {rootRouteComponents.First().Name}");
        }

        [Fact]
        public void RouteTableFactory_ShouldNotThrowAmbiguousRouteException()
        {
            // Arrange
            var assembly = typeof(Program).Assembly;
            var componentTypes = assembly.GetTypes()
                .Where(t => t.IsSubclassOf(typeof(ComponentBase)) && 
                           t.GetCustomAttributes<RouteAttribute>().Any())
                .ToList();

            // Act & Assert
            var exception = Record.Exception(() =>
            {
                var templatesByHandler = new Dictionary<Type, string[]>();
                
                foreach (var componentType in componentTypes)
                {
                    var routeAttributes = componentType.GetCustomAttributes<RouteAttribute>();
                    var templates = routeAttributes.Select(r => r.Template).ToArray();
                    templatesByHandler[componentType] = templates;
                }

                // This would throw if there are ambiguous routes
                // Note: We can't directly test RouteTableFactory.Create without full DI setup,
                // but we can validate the dictionary structure that would be passed to it
                var duplicateRoutes = templatesByHandler
                    .SelectMany(kvp => kvp.Value.Select(template => new { Template = template, Handler = kvp.Key }))
                    .GroupBy(x => x.Template)
                    .Where(g => g.Count() > 1)
                    .ToList();

                if (duplicateRoutes.Any())
                {
                    var duplicateRoute = duplicateRoutes.First();
                    throw new InvalidOperationException(
                        $"The following routes are ambiguous: '{duplicateRoute.Key}' in " +
                        string.Join(", ", duplicateRoute.Select(d => $"'{d.Handler.FullName}'")));
                }
            });

            Assert.Null(exception);

            _output.WriteLine($"✅ Issue-19 Test Passed: RouteTableFactory would not throw ambiguous route exception");
            _output.WriteLine($"   Tested {componentTypes.Count} components with route attributes");
        }

        [Theory]
        [InlineData("/home", typeof(NoorCanvas.Pages.Index))]
        [InlineData("/", typeof(Landing))]
        [InlineData("/landing", typeof(Landing))]
        [InlineData("/counter", typeof(Counter))]
        [InlineData("/fetchdata", typeof(FetchData))]
        public void SpecificRoutes_ShouldMapToCorrectComponents(string route, Type expectedComponent)
        {
            // Arrange
            var assembly = typeof(Program).Assembly;
            var componentTypes = assembly.GetTypes()
                .Where(t => t.IsSubclassOf(typeof(ComponentBase)))
                .ToList();

            // Act
            var matchingComponents = new List<Type>();
            
            foreach (var componentType in componentTypes)
            {
                var routeAttributes = componentType.GetCustomAttributes<RouteAttribute>();
                if (routeAttributes.Any(r => r.Template == route))
                {
                    matchingComponents.Add(componentType);
                }
            }

            // Assert
            Assert.Single(matchingComponents);
            Assert.Equal(expectedComponent, matchingComponents.First());

            _output.WriteLine($"✅ Route Test Passed: '{route}' maps to {expectedComponent.Name}");
        }
    }
}

namespace NoorCanvas.Services.Development
{
    /// <summary>
    /// Interface for generating test data for development/testing purposes
    /// </summary>
    public interface ITestDataService
    {
        /// <summary>
        /// Generates a random superhero name
        /// </summary>
        string GenerateSuperheroName();
        
        /// <summary>
        /// Generates a random email based on superhero name
        /// </summary>
        string GenerateSuperheroEmail();
        
        /// <summary>
        /// Gets a random country from the provided list
        /// </summary>
        string GetRandomCountry(IEnumerable<string> countries);
        
        /// <summary>
        /// Populates test data for UserLanding page
        /// </summary>
        (string name, string email, string country) GenerateUserLandingTestData(IEnumerable<string> availableCountries);
        
        /// <summary>
        /// Generates test data for UserLanding with name and email only
        /// </summary>
        (string name, string email) GenerateUserLandingNameAndEmail();
    }
}
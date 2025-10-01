namespace NoorCanvas.Services.Development
{
    /// <summary>
    /// Service for generating random test data using superhero themes
    /// Only available in development mode for testing purposes.
    /// </summary>
    public class TestDataService : ITestDataService
    {
        private readonly Random _random;
        private readonly ILogger<TestDataService> _logger;

        // Superhero names for test data generation
        private readonly string[] _superheroNames = {
            "Peter Parker", "Bruce Wayne", "Clark Kent", "Diana Prince", "Barry Allen",
            "Arthur Curry", "Victor Stone", "Hal Jordan", "Oliver Queen", "Bruce Banner",
            "Tony Stark", "Steve Rogers", "Natasha Romanoff", "Clint Barton", "Thor Odinson",
            "Scott Lang", "Hope Van Dyne", "Carol Danvers", "Stephen Strange", "T'Challa",
            "Wanda Maximoff", "Pietro Maximoff", "Vision", "Sam Wilson", "James Rhodes",
            "Pepper Potts", "Happy Hogan", "May Parker", "Ned Leeds", "Michelle Jones",
            "Kate Bishop", "Yelena Belova", "John Walker", "Bucky Barnes", "Loki Laufeyson",
            "Matt Murdock", "Jessica Jones", "Luke Cage", "Danny Rand", "Frank Castle",
            "Wade Wilson", "Logan Howlett", "Ororo Munroe", "Scott Summers", "Jean Grey",
            "Kurt Wagner", "Kitty Pryde", "Bobby Drake", "Warren Worthington", "Hank McCoy",
            "Erik Lehnsherr", "Charles Xavier", "Raven Darkholme", "Emma Frost", "Gambit Lebeau"
        };

        // Email domains for test emails
        private readonly string[] _emailDomains = {
            "hero.com", "avengers.org", "justice.league", "xmen.edu", "shield.gov",
            "stark.industries", "wayne.enterprises", "daily.planet", "oscorp.com", "fantastic4.org"
        };

        public TestDataService(ILogger<TestDataService> logger)
        {
            _logger = logger;
            _random = new Random();
        }

        /// <inheritdoc/>
        public string GenerateSuperheroName()
        {
            var name = _superheroNames[_random.Next(_superheroNames.Length)];
            _logger.LogDebug("NOOR-TEST-DATA: Generated superhero name: {Name}", name);
            return name;
        }

        /// <inheritdoc/>
        public string GenerateSuperheroEmail()
        {
            var name = _superheroNames[_random.Next(_superheroNames.Length)];
            var domain = _emailDomains[_random.Next(_emailDomains.Length)];

            // Convert name to email format (lowercase, replace spaces with dots)
            var emailPrefix = name.ToLowerInvariant().Replace(" ", ".");
            var email = $"{emailPrefix}@{domain}";

            _logger.LogDebug("NOOR-TEST-DATA: Generated superhero email: {Email}", email);
            return email;
        }

        /// <inheritdoc/>
        public string GetRandomCountry(IEnumerable<string> countries)
        {
            var countryList = countries.ToList();
            if (!countryList.Any())
            {
                _logger.LogWarning("NOOR-TEST-DATA: No countries available, returning default");
                return "United States";
            }

            var country = countryList[_random.Next(countryList.Count)];
            _logger.LogDebug("NOOR-TEST-DATA: Selected random country: {Country}", country);
            return country;
        }

        /// <inheritdoc/>
        public (string name, string email, string country) GenerateUserLandingTestData(IEnumerable<string> availableCountries)
        {
            var name = GenerateSuperheroName();
            var email = GenerateSuperheroEmail();
            var country = GetRandomCountry(availableCountries);

            _logger.LogInformation("NOOR-TEST-DATA: Generated complete test data set - Name: {Name}, Email: {Email}, Country: {Country}",
                name, email, country);

            return (name, email, country);
        }

        /// <inheritdoc/>
        public (string name, string email) GenerateUserLandingNameAndEmail()
        {
            var name = GenerateSuperheroName();
            var email = GenerateSuperheroEmail();

            _logger.LogInformation("NOOR-TEST-DATA: Generated name and email - Name: {Name}, Email: {Email}",
                name, email);

            return (name, email);
        }
    }
}
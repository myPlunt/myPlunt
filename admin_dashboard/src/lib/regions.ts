import type worldMap from '../assets/world-map.json'

// Typed against the map's own keys, so a misspelled country fails the build.
type Country = keyof typeof worldMap

type Region = { name: string; parent?: string; color: string; countries: Country[] }

// Every country or territory on the map belongs to exactly one region.
export const REGIONS: Region[] = [
  {
    name: 'Canada, USA and Mexico',
    color: 'var(--color-region-north-america)',
    countries: ['Canada', 'Mexico', 'St. Pierre and Miquelon', 'United States of America'],
  },
  {
    name: 'Central America',
    color: 'var(--color-region-central-america)',
    countries: ['Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras', 'Nicaragua', 'Panama'],
  },
  {
    name: 'The Caribbean',
    color: 'var(--color-region-caribbean)',
    countries: [
      'Saba and St. Eustatius', 'Bonaire',
      'Anguilla', 'Antigua and Barb.', 'Aruba', 'Bahamas', 'Barbados', 'Bermuda', 'British Virgin Is.', 'Cayman Is.',
      'Cuba', 'Curaçao', 'Dominica', 'Dominican Rep.', 'Grenada', 'Guadeloupe', 'Haiti', 'Jamaica', 'Martinique',
      'Montserrat', 'Puerto Rico', 'Saint Lucia', 'Sint Maarten', 'St-Barthélemy', 'St-Martin', 'St. Kitts and Nevis',
      'St. Vin. and Gren.', 'Trinidad and Tobago', 'Turks and Caicos Is.', 'U.S. Virgin Is.',
    ],
  },
  {
    name: 'South America',
    color: 'var(--color-region-south-america)',
    countries: [
      'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Falkland Is.', 'French Guiana', 'Guyana',
      'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela',
    ],
  },
  { name: 'Greenland', color: 'var(--color-region-greenland)', countries: ['Greenland'] },
  {
    name: 'Scandinavia and Nordics',
    parent: 'Europe',
    color: 'var(--color-region-scandinavia)',
    countries: ['Denmark', 'Faeroe Is.', 'Finland', 'Iceland', 'Norway', 'Sweden', 'Åland'],
  },
  {
    name: 'Western Europe',
    parent: 'Europe',
    color: 'var(--color-region-western-europe)',
    countries: [
      'Belgium', 'France', 'Guernsey', 'Ireland', 'Isle of Man', 'Jersey', 'Luxembourg', 'Monaco', 'Netherlands',
      'United Kingdom',
    ],
  },
  {
    name: 'Central Europe',
    parent: 'Europe',
    color: 'var(--color-region-central-europe)',
    countries: ['Austria', 'Czechia', 'Germany', 'Hungary', 'Liechtenstein', 'Poland', 'Slovakia', 'Switzerland'],
  },
  {
    name: 'Eastern Europe',
    parent: 'Europe',
    color: 'var(--color-region-eastern-europe)',
    countries: ['Belarus', 'Estonia', 'Latvia', 'Lithuania', 'Moldova', 'Ukraine'],
  },
  {
    name: 'Balkans',
    parent: 'Europe',
    color: 'var(--color-region-balkans)',
    countries: [
      'Albania', 'Bosnia and Herz.', 'Bulgaria', 'Croatia', 'Greece', 'Kosovo', 'Macedonia', 'Montenegro', 'Romania',
      'Serbia', 'Slovenia',
    ],
  },
  {
    name: 'Southern Europe',
    parent: 'Europe',
    color: 'var(--color-region-southern-europe)',
    countries: ['Andorra', 'Cyprus', 'Italy', 'Malta', 'N. Cyprus', 'Portugal', 'San Marino', 'Spain', 'Vatican'],
  },
  {
    name: 'Eurasia',
    color: 'var(--color-region-eurasia)',
    countries: ['Armenia', 'Azerbaijan', 'Georgia', 'Russia', 'Turkey'],
  },
  {
    name: 'Northern Africa',
    color: 'var(--color-region-northern-africa)',
    countries: ['Algeria', 'Egypt', 'Libya', 'Morocco', 'Sudan', 'Tunisia', 'W. Sahara'],
  },
  {
    name: 'West Africa',
    color: 'var(--color-region-west-africa)',
    countries: [
      'Benin', 'Burkina Faso', 'Cabo Verde', "Côte d'Ivoire", 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Liberia',
      'Mali', 'Mauritania', 'Niger', 'Nigeria', 'Saint Helena', 'Senegal', 'Sierra Leone', 'Togo',
    ],
  },
  {
    name: 'Central Africa',
    color: 'var(--color-region-central-africa)',
    countries: [
      'Burundi', 'Cameroon', 'Central African Rep.', 'Chad', 'Congo', 'Dem. Rep. Congo', 'Eq. Guinea', 'Gabon',
      'Rwanda', 'São Tomé and Principe',
    ],
  },
  {
    name: 'East Africa',
    color: 'var(--color-region-east-africa)',
    countries: [
      'Djibouti', 'Eritrea', 'Ethiopia', 'Kenya', 'S. Sudan', 'Somalia', 'Somaliland', 'Tanzania', 'Uganda',
    ],
  },
  {
    name: 'Southern Africa',
    color: 'var(--color-region-southern-africa)',
    countries: [
      'Angola', 'Botswana', 'Comoros', 'Lesotho', 'Madagascar', 'Malawi', 'Mauritius', 'Mayotte', 'Mozambique',
      'Namibia', 'Réunion', 'Seychelles', 'South Africa', 'Zambia', 'Zimbabwe', 'eSwatini',
    ],
  },
  {
    name: 'Middle East',
    color: 'var(--color-region-middle-east)',
    countries: [
      'Bahrain', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Oman', 'Palestine', 'Qatar', 'Saudi Arabia',
      'Syria', 'United Arab Emirates', 'Yemen',
    ],
  },
  {
    name: 'Central Asia',
    color: 'var(--color-region-central-asia)',
    countries: ['Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Uzbekistan'],
  },
  {
    name: 'Southern Asia',
    color: 'var(--color-region-southern-asia)',
    countries: [
      'Afghanistan', 'Bangladesh', 'Bhutan', 'India', 'Maldives', 'Nepal', 'Pakistan', 'Siachen Glacier', 'Sri Lanka',
    ],
  },
  {
    name: 'Eastern Asia',
    color: 'var(--color-region-eastern-asia)',
    countries: ['China', 'Hong Kong', 'Japan', 'Macao', 'Mongolia', 'North Korea', 'South Korea', 'Taiwan'],
  },
  {
    name: 'Southeast Asia',
    color: 'var(--color-region-southeast-asia)',
    countries: [
      'Brunei', 'Cambodia', 'Indonesia', 'Laos', 'Malaysia', 'Myanmar', 'Philippines', 'Singapore', 'Thailand',
      'Timor-Leste', 'Vietnam',
    ],
  },
  {
    name: 'Oceania',
    color: 'var(--color-region-oceania)',
    countries: [
      'American Samoa', 'Ashmore and Cartier Is.', 'Australia', 'Cook Is.', 'Fiji', 'Fr. Polynesia', 'Guam', 'Kiribati',
      'Marshall Is.', 'Micronesia', 'N. Mariana Is.', 'Nauru', 'New Caledonia', 'New Zealand', 'Niue', 'Norfolk Island',
      'Palau', 'Papua New Guinea', 'Pitcairn Is.', 'Samoa', 'Solomon Is.', 'Tonga', 'Vanuatu', 'Wallis and Futuna Is.',
    ],
  },
]

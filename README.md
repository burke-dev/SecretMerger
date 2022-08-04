# SecretMerger
Merge two json files - one config and one secrets file
Input files are:
  - rawData\secretManager\config.json
  - rawData\secretManager\secrets.json
Output file is:
  - output\secretMerger-0-Output.json


Example:
  - config.json
  {
    "Meditation": {
      "EventSubject": "Duck",
      "Credential": "*****",    <== if this key does not exist it will still add the new key/value combination
      "TopicEndpointUrl": "https://www.youtube.com/watch?v=YbaTur4A1OU"
    }
  }

  - secrets.json
  {
    "Meditation": {
      "Credential": "1ihQjlEgXDXYqXn8HmRCeVp13Uhe0CXwT6ccfE5TKME="
    }
  }

  -output
  {
    "Meditation": {
      "EventSubject": "Duck",
      "Credential": "1ihQjlEgXDXYqXn8HmRCeVp13Uhe0CXwT6ccfE5TKME=",
      "TopicEndpointUrl": "https://www.youtube.com/watch?v=YbaTur4A1OU"
    }
  }
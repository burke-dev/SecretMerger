# SecretMerger
Merge two json files into one output file - one config and one secrets file

To run:
  - launch.json has option for "Secret Merger"

Input files are:
  - "config"  =>  rawData\config.json
  - "secrets" =>  rawData\secrets.json

Output file is:
  - "output"  =>  output\secretMerger-Output.json


Example:
  - config
  {
    "Meditation": {
      "EventSubject": "Duck",
      "Credential": "*****",    <== if this key does not exist it will still add the new key/value combination
      "TopicEndpointUrl": "https://www.youtube.com/watch?v=YbaTur4A1OU"
    }
  }

  - secrets
  {
    "Meditation": {
      "Credential": "1ihQjlEgXDXYqXn8HmRCeVp13Uhe0CXwT6ccfE5TKME="
    }
  }

  - output
  {
    "Meditation": {
      "EventSubject": "Duck",
      "Credential": "1ihQjlEgXDXYqXn8HmRCeVp13Uhe0CXwT6ccfE5TKME=",
      "TopicEndpointUrl": "https://www.youtube.com/watch?v=YbaTur4A1OU"
    }
  }
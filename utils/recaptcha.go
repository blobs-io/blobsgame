package utils

import (
	"encoding/json"
	"errors"
	"github.com/blobs-io/blobsgame/utils/config"
	"io/ioutil"
	"net/http"
)

const (
	RecaptchaEndpoint = "https://www.google.com/recaptcha/api/siteverify"
)

type RecaptchaResponseBody struct {
	Success bool `json:"success"`
	ChallengeTimestamp string `json:"challenge_ts"`
	Hostname string `json:"hostname"`
	Score float32 `json:"score"`
	Action string `json:"action"`
}

func RateCaptcha(token string) (RecaptchaResponseBody, error) {
	req, err := http.Get(RecaptchaEndpoint + "?secret=" + config.MainConfig.Tokens.Recaptcha + "&response=" + token)
	if err != nil {
		return RecaptchaResponseBody{}, err
	}
	defer req.Body.Close()
	if req.StatusCode >= 400 {
		return RecaptchaResponseBody{}, errors.New("an unknown error occurred")
	}

	resp, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return RecaptchaResponseBody{}, err
	}

	var respBody RecaptchaResponseBody
	err = json.Unmarshal(resp, &respBody)
	if err != nil {
		return RecaptchaResponseBody{}, err
	}

	return respBody, nil
}

func ValidateCaptcha(response RecaptchaResponseBody) bool {
	return response.Success && response.Score >= .6
}
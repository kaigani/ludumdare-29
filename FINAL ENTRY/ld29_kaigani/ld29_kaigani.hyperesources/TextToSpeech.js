/*
 * TTS - Text-to-Speech API
 *
 *	
 *	METHODS
 *  -------
 *  
 *  speakText( AudioHandler , text) - reads text using on of the TTS servers at random
 *
 *
 *	TODO » Should be error checking API endpoint responses
 *
 */



var TextToSpeech = function(){};

TextToSpeech.prototype.speakText = function(audio, text){

	var langList = "ca-es,zh-cn,zh-hk,zh-tw,da-dk,nl-nl,en-au,en-ca,en-gb,en-in,en-us,fi-fi,fr-ca,fr-fr,de-de,it-it,ja-jp,ko-kr,nb-no,pl-pl,pt-br,pt-pt,ru-ru,es-mx,es-es,sv-se".split(',');

	var lang = langList[ Math.floor(Math.random() * langList.length) ];
	lang = (Math.random() < 0.2)?lang:"en-gb";
	console.log(lang);

	var ttsEndpoint_1 = "http://api.voicerss.org/?key=5941ea93b42f4c6582332ada1d8ec61e&hl="+lang+"&f=48khz_16bit_stereo&src=";
	var ttsEndpoint_2 = "http://tts-api.com/tts.mp3?q="; // triggers cross-domain error -- why?

	//var ttsEndpoint = (Math.random() < 0.5)?ttsEndpoint_1:ttsEndpoint_2;
	var ttsEndpoint = ttsEndpoint_1;
	
	
	if(Math.random() < 0.5){
		audio.playSoundUrl(ttsEndpoint+text);
	}else{
		this.localSpeakText(text);
	}
	
};

TextToSpeech.prototype.localSpeakText = function(text){

	meSpeak.speak(text, {'variant' : 'f2'});
};

// MeSpeak config
meSpeak.setConfigData(mespeak_config_data);
meSpeak.setVoiceData(mespeak_voice_data);


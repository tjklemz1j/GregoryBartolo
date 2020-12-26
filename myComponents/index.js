import './libs/webaudio-controls.js';
import {initVisualizer, play, setFilters} from './visualizer.js';

const getBaseURL = () => {
	return new URL('.', import.meta.url);
};

var width, height;

var dataArray, bufferLength;

const template = document.createElement("template");
template.innerHTML = /*html*/`
  <style>
    #panel_left {
        width: 130%;
        text-align: center;
    }

    #frequency {
        background: linear-gradient(90deg, rgba(61,31,31,1) 0%, rgba(186,20,20,1) 50%, rgba(61,31,31,1) 100%);
        margin: 1rem 2rem 2rem 2rem;
        border: 5px solid #000000;
    }

    #playlist {
        background: linear-gradient(90deg, rgba(61,31,31,1) 0%, rgba(186,20,20,1) 50%, rgba(61,31,31,1) 100%);
        border: 5px solid #000000;
        width: fit-content;
        display: inline-grid;
        padding: 0.5em 0.5rem 0.5rem 0.5rem;
        margin-top: 0.5rem;
        font-weight: 700;
    }

    #frequency_sliders {
        display: flex;
        justify-content: space-around;
    }

    #frequency_text {
        display: flex;
        justify-content: space-around;
        font-weight: 700;
    }

    #buttons_player {
        background: linear-gradient(90deg, rgba(61,31,31,1) 0%, rgba(186,20,20,1) 50%, rgba(61,31,31,1) 100%);
        border: 5px solid #000000;
        width: fit-content;
        display: inline-block;
        padding: 1rem 1rem 0rem 1rem;
    }

    #panel_vitesse {
        display: flex;
        align-items: center;
        font-weight: 600;
        font-size: 17px;
    }

    .white {
        color: white;
    }
  </style>

  <div id="panel_left">
    <div id="control_panel">
        <audio id="myPlayer"></audio>
        <webaudio-slider
            id="slider"
            direction="horz"
            width="350"
            height="30"
            style="margin-bottom: 1rem;">
        </webaudio-slider>
        <br/>
        <div id="buttons_player">
            <webaudio-switch
                id="prevsong"
                src="./assets/imgs/S_Arrow2-Prev.png"
                type="kick">
            </webaudio-switch>
            <webaudio-switch
                id="recule10"
                src="./assets/imgs/S_Arrow2-L.png"
                type="kick">
            </webaudio-switch>
            <webaudio-switch
                id="play"
                src="./assets/imgs/S_Arrow2-Play.png">
            </webaudio-switch>
            <webaudio-switch
                id="avance10"
                src="./assets/imgs/S_Arrow2-R.png"
                type="kick">
            </webaudio-switch>
            <webaudio-switch
                id="nextsong"
                src="./assets/imgs/S_Arrow2-Suiv.png"
                type="kick">
            </webaudio-switch>
            <br/>
            <webaudio-switch
                id="loop"
                src="./assets/imgs/loop.png"
                style="margin-bottom: 1rem;">
            </webaudio-switch>
            <webaudio-knob
                id="volumeKnob" 
                src="./assets/imgs/knob_volume.png" 
                value=5 min=0 max=10 step=0.01
                diameter="32"
                tooltip="Volume: %d">
            </webaudio-knob>
            <br/>
            <div id="panel_vitesse">
                Vitesse de lecture 0
                <webaudio-slider
                    id="vitesseLecture"
                    direction="horz"
                    colors="800;#800;#fff"
                    min=0.2
                    max=5
                    step=0.1
                    value="2"
                    style="margin: 5px;">
                </webaudio-slider>
                5
            </div>
        </div>
        <br>

        <div id="playlist">
            <span data-sound="./myComponents/songs/Kiss-Iwasmadeforlovinyou.mp3">
                Kiss - I was made for lovin you
            </span>
  
            <span data-sound="./myComponents/songs/ACDC-Thunderstruck.mp3">
                ACDC - Thunderstruck
            </span>

            <span data-sound="./myComponents/songs/ACDC-Backinblack.mp3">
                ACDC - Back in black
            </span>
        </div>

        <br>
        <div id="frequency">
            <div id="frequency_sliders">
                <webaudio-knob
                    id="hz1" 
                    src="./assets/imgs/Fader_red_sans.png"
                    sprites="200">
                </webaudio-knob>
                <webaudio-knob
                    id="hz2" 
                    src="./assets/imgs/Fader_red_sans.png"
                    sprites="200">
                </webaudio-knob>
                <webaudio-knob
                    id="hz3" 
                    src="./assets/imgs/Fader_red_sans.png"
                    sprites="200">
                </webaudio-knob>
                <webaudio-knob
                    id="hz4" 
                    src="./assets/imgs/Fader_red_sans.png"
                    sprites="200">
                </webaudio-knob>
                <webaudio-knob
                    id="hz5" 
                    src="./assets/imgs/Fader_red_sans.png"
                    sprites="200">
                </webaudio-knob>
                <webaudio-knob
                    id="hz6" 
                    src="./assets/imgs/Fader_red_sans.png"
                    sprites="200">
                </webaudio-knob>
            </div>
            <div id="frequency_text">
                <span>60 Hz</span>
                <span>170 Hz</span>
                <span>350 Hz</span>
                <span>1000 Hz</span>
                <span>3500 Hz</span>
                <span>10000 Hz</span>
            </div>
        </div>
        
    </div>
  </div>


  <div id="visualizer_div">
    <a id="badge" href="http://www.chromeexperiments.com/experiment/audio-cloud/" target="_blank"></a>
  </div>
  `;

class MyAudioPlayer extends HTMLElement {
    constructor() {
        super();
        // Récupération des attributs HTML
        //this.value = this.getAttribute("value");

        // On crée un shadow DOM
        this.attachShadow({ mode: "open" });

        console.log("URL de base du composant : " + getBaseURL())
    }

    connectedCallback() {
        // Appelée automatiquement par le browser
        // quand il insère le web component dans le DOM
        // de la page du parent..

        // On clone le template HTML/CSS (la gui du wc)
        // et on l'ajoute dans le shadow DOM
        this.shadowRoot.appendChild(template.content.cloneNode(true));
 
        // fix relative URLs
        this.fixRelativeURLs();

        this.player = this.shadowRoot.querySelector("#myPlayer");
        this.player.crossOrigin = "anonymous";

        //recupération des musiques de la playlist
        this.playlist = this.shadowRoot.querySelector("#playlist").children;
        this.currentPlay = 0;
        this.player.src = this.playlist[this.currentPlay].dataset.sound;
        this.playlist[this.currentPlay].className = "white";

        // init bubble and bar visualizer
        initVisualizer(this.player);

        // on définit les écouteurs etc.
        this.defineListeners();

        // avancée du slider selon le temps de la musique
        this.shadowRoot.querySelector("#slider").min = 0;
        this.shadowRoot.querySelector("#slider").value = 0;
        this.player.ontimeupdate = () => {
            this.shadowRoot.querySelector("#slider").value = this.player.currentTime;
            this.shadowRoot.querySelector("#slider").max = this.player.duration;
        }
        
        //loop desactivé de base
        this.shadowRoot.querySelector("#loop").value = 1;
    }

    fixRelativeURLs() {
        const elems = this.shadowRoot.querySelectorAll("webaudio-knob, webaudio-slider, webaudio-switch, img");
        elems.forEach(e => {
            const path = e.src;
            if(path != null) {
                e.src = getBaseURL() + path;
            }
        });
    }

    defineListeners() {
        this.shadowRoot.querySelector("#play").onclick = () => {
            if (this.player.paused) {
               this.player.play();
                play(this.player); 
            } else {
                this.player.pause();
            }
            
        }

        this.shadowRoot.querySelector("#recule10").onclick = () => {
            this.player.currentTime -= 10;
        }

        this.shadowRoot.querySelector("#avance10").onclick = () => {
            this.player.currentTime += 10;
        }

        this.shadowRoot.querySelector("#prevsong").onclick = () => {
            if(this.player.loop == false)
            {
              this.playlist[this.currentPlay].className = "";

              this.currentPlay--;
              if(this.currentPlay < 0)
              {
                this.currentPlay = this.playlist.length - 1;
              }
              this.player.src = this.playlist[this.currentPlay].dataset.sound;
              this.playlist[this.currentPlay].className = "white";

              this.player.play();
            }
        }

        this.shadowRoot.querySelector("#nextsong").onclick = () => {
            if(this.player.loop == false)
            {
              this.playlist[this.currentPlay].className = "";

              this.currentPlay++;
              if(this.currentPlay >= this.playlist.length)
              {
                this.currentPlay = 0;
              }
              this.player.src = this.playlist[this.currentPlay].dataset.sound;
              this.playlist[this.currentPlay].className = "white";

              this.player.play();
            }
        }

        this.shadowRoot.querySelector("#vitesseLecture").oninput = (event) => {
            this.player.playbackRate = parseFloat(event.target.value);
        }

        this.shadowRoot.querySelector("#slider").onchange = (event) => {
            this.player.currentTime = parseFloat(event.target.value);
        }

        this.shadowRoot.querySelector("#volumeKnob").oninput = (event) => {
            this.player.volume = event.target.value/10;
        }

        this.shadowRoot.querySelector("#loop").onclick = () => {
            this.player.loop = !this.player.loop;
        }

        this.shadowRoot.querySelector("#slider").addEventListener("click", (e) => {
            this.player.currentTime = ((e.offsetX/this.progress_bar.offsetWidth) * this.player.duration);
        });

        this.shadowRoot.querySelector("#hz1").addEventListener("input", (event) => {
            this.changeHz(event.target.value,0);
        });
          this.shadowRoot.querySelector("#hz2").addEventListener("input", (event) => {
            this.changeHz(event.target.value,1);
        });
      
        this.shadowRoot.querySelector("#hz3").addEventListener("input", (event) => {
          this.changeHz(event.target.value,2);
        });
      
        this.shadowRoot.querySelector("#hz4").addEventListener("input", (event) => {
          this.changeHz(event.target.value,3);
        });
      
        this.shadowRoot.querySelector("#hz5").addEventListener("input", (event) => {
          this.changeHz(event.target.value,4);
        });
      
        this.shadowRoot.querySelector("#hz6").addEventListener("input", (event) => {
          this.changeHz(event.target.value,5);
        });

    }

    changeHz(sliderVal,nbFilter) {
        var value = parseFloat(sliderVal);
        setFilters(value, nbFilter);
    }

}

customElements.define("my-player", MyAudioPlayer);

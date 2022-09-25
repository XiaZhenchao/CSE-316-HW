import React, { Component } from 'react';

export default class RenameSongModal extends Component {

    render(){
        const { RenameSongKeyPair,hideRenameSongModalCallback, RenameSongCallback,renameId } = this.props;
        let songname = "";
        let artistname = "";
        let youtubeid = "";
        if (RenameSongKeyPair && renameId) {
            songname = RenameSongKeyPair.songs[renameId-1].title
            artistname = RenameSongKeyPair.songs[renameId-1].artist
            youtubeid = RenameSongKeyPair.songs[renameId-1].youTubeId
            console.log("songname: "+ songname)
            console.log("artistname: "+ artistname)
            console.log("youtubeid: "+ youtubeid)
            document.getElementById("edit-song-modal-title-textfield").value = songname
            document.getElementById("edit-song-modal-artist-textfield").value = artistname
            document.getElementById("edit-song-modal-youTubeId-textfield").value = youtubeid
        }

       
       
        return(
            <div id="edit-song-modal" class="modal" data-animation="slideInOutLeft">
            <div id='edit-song-root' class="modal-root">
                <div id="edit-song-modal-header" class="modal-north">Edit Song</div>
                <div id="edit-song-modal-content" class="modal-center">
                    <div id="title-prompt" class="modal-prompt">Title:</div><input id="edit-song-modal-title-textfield" class='modal-textfield' type="text" defaultValue={songname} />
                    <div id="artist-prompt" class="modal-prompt">Artist:</div><input id="edit-song-modal-artist-textfield" class='modal-textfield' type="text" defaultValue={artistname}  />
                    <div id="you-tube-id-prompt" class="modal-prompt">You Tube Id:</div><input id="edit-song-modal-youTubeId-textfield" class='modal-textfield' type="text" defaultValue={youtubeid} />
                </div>
                <div class="modal-south">
                    <input 
                        type="button" 
                        id="edit-song-confirm-button" 
                        class="modal-button" 
                        value='Confirm' 
                        onClick={RenameSongCallback}/>

                    <input 
                        type="button" 
                        id="edit-song-cancel-button" 
                        class="modal-button" 
                        value='Cancel' 
                        onClick={hideRenameSongModalCallback}/>
                </div>
            </div>
        </div>
        );
    }
}
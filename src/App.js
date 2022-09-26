import React from 'react';
import './App.css';

// IMPORT DATA MANAGEMENT AND TRANSACTION STUFF
import DBManager from './db/DBManager';
import jsTPS from './common/jsTPS.js';

// OUR TRANSACTIONS
import MoveSong_Transaction from './transactions/MoveSong_Transaction.js';
import AddSong_Transaction from './transactions/AddSong_Transaction';
import DeleteSong_Transaction from './transactions/DeleteSong_Transaction';
import EditSong_Transaction from './transactions/EditSong_Transaction';

// THESE REACT COMPONENTS ARE MODALS
import DeleteListModal from './components/DeleteListModal.js';

import DeleteSongModal from './components/DeleteSongModal';

import RenameSongModal from './components/RenameSongModal';

// THESE REACT COMPONENTS ARE IN OUR UI
import Banner from './components/Banner.js';
import EditToolbar from './components/EditToolbar.js';
import PlaylistCards from './components/PlaylistCards.js';
import SidebarHeading from './components/SidebarHeading.js';
import SidebarList from './components/SidebarList.js';
import Statusbar from './components/Statusbar.js';



class App extends React.Component {
    constructor(props) {
        super(props);

        // THIS IS OUR TRANSACTION PROCESSING SYSTEM
        this.tps = new jsTPS();

        // THIS WILL TALK TO LOCAL STORAGE
        this.db = new DBManager();

        // GET THE SESSION DATA FROM OUR DATA MANAGER
        let loadedSessionData = this.db.queryGetSessionData();

        // SETUP THE INITIAL STATE
        this.state = {
            listKeyPairMarkedForDeletion : null,
            currentList : null,
            sessionData : loadedSessionData
        }
    }
    sortKeyNamePairsByName = (keyNamePairs) => {
        keyNamePairs.sort((keyPair1, keyPair2) => {
            // GET THE LISTS
            return keyPair1.name.localeCompare(keyPair2.name);
        });
    }

    
    


    // THIS FUNCTION BEGINS THE PROCESS OF CREATING A NEW LIST
    createNewList = () => {
        // FIRST FIGURE OUT WHAT THE NEW LIST'S KEY AND NAME WILL BE
        let newKey = this.state.sessionData.nextKey;
        let newName = "Untitled" + newKey;

        // MAKE THE NEW LIST
        let newList = {
            key: newKey,
            name: newName,
            songs: []
        };

        // MAKE THE KEY,NAME OBJECT SO WE CAN KEEP IT IN OUR
        // SESSION DATA SO IT WILL BE IN OUR LIST OF LISTS
        let newKeyNamePair = { "key": newKey, "name": newName };
        let updatedPairs = [...this.state.sessionData.keyNamePairs, newKeyNamePair];
        this.sortKeyNamePairsByName(updatedPairs);

        // CHANGE THE APP STATE SO THAT THE CURRENT LIST IS
        // THIS NEW LIST AND UPDATE THE SESSION DATA SO THAT THE
        // NEXT LIST CAN BE MADE AS WELL. NOTE, THIS setState WILL
        // FORCE A CALL TO render, BUT THIS UPDATE IS ASYNCHRONOUS,
        // SO ANY AFTER EFFECTS THAT NEED TO USE THIS UPDATED STATE
        // SHOULD BE DONE VIA ITS CALLBACK
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: newList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey + 1,
                counter: prevState.sessionData.counter + 1,
                keyNamePairs: updatedPairs
            },
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: prevState.RenameSongID
        }), () => {
            // PUTTING THIS NEW LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationCreateList(newList);

            // SO IS STORING OUR SESSION DATA
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF DELETING A LIST.
    deleteList = (key) => {
        // IF IT IS THE CURRENT LIST, CHANGE THAT
        let newCurrentList = null;
        if (this.state.currentList) {
            if (this.state.currentList.key !== key) {
                // THIS JUST MEANS IT'S NOT THE CURRENT LIST BEING
                // DELETED SO WE'LL KEEP THE CURRENT LIST AS IT IS
                newCurrentList = this.state.currentList;
            }
        }

        let keyIndex = this.state.sessionData.keyNamePairs.findIndex((keyNamePair) => {
            return (keyNamePair.key === key);
        });
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        if (keyIndex >= 0)
            newKeyNamePairs.splice(keyIndex, 1);

        // AND FROM OUR APP STATE
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : null,
            currentList: newCurrentList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter - 1,
                keyNamePairs: newKeyNamePairs
            },
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: prevState.RenameSongID
        }), () => {
            // DELETING THE LIST FROM PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationDeleteList(key);

            // SO IS STORING OUR SESSION DATA
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    deleteMarkedList = () => {
        this.deleteList(this.state.listKeyPairMarkedForDeletion.key);
        this.hideDeleteListModal();
    }
    // THIS FUNCTION SPECIFICALLY DELETES THE CURRENT LIST
    deleteCurrentList = () => {
        if (this.state.currentList) {
            this.deleteList(this.state.currentList.key);
        }
    }
    renameList = (key, newName) => {
        console.log("key: "+ key)
        console.log("newName: " + newName)
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        // NOW GO THROUGH THE ARRAY AND FIND THE ONE TO RENAME
        for (let i = 0; i < newKeyNamePairs.length; i++) {
            let pair = newKeyNamePairs[i];
            if (pair.key === key) {
                pair.name = newName;
            }
        }
        this.sortKeyNamePairsByName(newKeyNamePairs);

        // WE MAY HAVE TO RENAME THE currentList
        let currentList = this.state.currentList;
        if (currentList.key === key) {
            currentList.name = newName;
        }

        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : null,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter,
                keyNamePairs: newKeyNamePairs
            },
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: prevState.RenameSongID
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            let list = this.db.queryGetList(key);
            list.name = newName;
            this.db.mutationUpdateList(list);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF LOADING A LIST FOR EDITING
    loadList = (key) => {
        let newCurrentList = this.db.queryGetList(key);
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: newCurrentList,
            sessionData: this.state.sessionData,
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: prevState.RenameSongID
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            this.tps.clearAllTransactions();
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CLOSING THE CURRENT LIST
    closeCurrentList = () => {
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: null,
            sessionData: this.state.sessionData,
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: prevState.RenameSongID
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            this.tps.clearAllTransactions();
        });
    }
    setStateWithUpdatedList(list) {
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList : list,
            sessionData : this.state.sessionData,
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: prevState.RenameSongID
        }), () => {
            // UPDATING THE LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationUpdateList(this.state.currentList);
        });
    }
    getPlaylistSize = () => {
        return this.state.currentList.songs.length;
    }
    // THIS FUNCTION MOVES A SONG IN THE CURRENT LIST FROM
    // start TO end AND ADJUSTS ALL OTHER ITEMS ACCORDINGLY
    moveSong(start, end) {
        let list = this.state.currentList;

        // WE NEED TO UPDATE THE STATE FOR THE APP
        start -= 1;
        end -= 1;
        if (start < end) {
            let temp = list.songs[start];
            for (let i = start; i < end; i++) {
                list.songs[i] = list.songs[i + 1];
            }
            list.songs[end] = temp;
        }
        else if (start > end) {
            let temp = list.songs[start];
            for (let i = start; i > end; i--) {
                list.songs[i] = list.songs[i - 1];
            }
            list.songs[end] = temp;
        }
        this.setStateWithUpdatedList(list);
    }

    addAddSongTransaction = () => {
        let transaction = new AddSong_Transaction(this);
        this.tps.addTransaction(transaction);
    }


    // THIS FUNCTION ADDS A MoveSong_Transaction TO THE TRANSACTION STACK
    addMoveSongTransaction = (start, end) => {
        let transaction = new MoveSong_Transaction(this, start, end);
        this.tps.addTransaction(transaction);
    }
    // THIS FUNCTION BEGINS THE PROCESS OF PERFORMING AN UNDO
    undo = () => {
        if (this.tps.hasTransactionToUndo()) {
            this.tps.undoTransaction();

            // MAKE SURE THE LIST GETS PERMANENTLY UPDATED
            this.db.mutationUpdateList(this.state.currentList);
            // console.log("song title: "+ this.state.currentList.songs[0].title)
        }
    }
    // THIS FUNCTION BEGINS THE PROCESS OF PERFORMING A REDO
    redo = () => {
        if (this.tps.hasTransactionToRedo()) {
            this.tps.doTransaction();

            // MAKE SURE THE LIST GETS PERMANENTLY UPDATED
            this.db.mutationUpdateList(this.state.currentList);
        }   
    }

    ShortcutDetect()
    {
        function KeyPress(event, app) {
                if (event.key === "z" && event.ctrlKey){
                    app.undo();
                    console.log("undo");
                }
                if (event.key === "y" && event.ctrlKey){
                    app.redo();
                    console.log("redo");
                } 
        }
        document.onkeydown = (e) => KeyPress(e,this);
    }
    createNewSong =() =>{
        console.log("createNewSong function has been called")
        let currentlistLength = this.getPlaylistSize()
        console.log("currentlistLength: "+ currentlistLength);
        let newSong = {
            title: "Untitled",
            artist: "Unknown",
            youTubeId: "dQw4w9WgXcQ"
        };
        this.state.currentList.songs.splice(currentlistLength,0,newSong)
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: this.state.currentList,
            sessionData: this.state.sessionData,
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: prevState.RenameSongID
        }), () => {
            // PUTTING THIS NEW LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationUpdateList(this.state.currentList);

            // SO IS STORING OUR SESSION DATA
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
        
    }

    renameMarkedSong = () =>{
        //this.renameSong(this.state.RenameSongID);
        this.addEditSongTransaction(this.state.RenameSongID);
        this.hideRenameSongModal();
    }

    addEditSongTransaction = (index) => {
        let OldSongName = this.state.currentList.songs[index-1].title;
        let OldArtistName = this.state.currentList.songs[index-1].artist;
        let OldyoutubeId = this.state.currentList.songs[index-1].youTubeId;
        let oldSong = {title: OldSongName, artist: OldArtistName, youTubeId: OldyoutubeId}

        let newSongName = document.getElementById("edit-song-modal-title-textfield").value;
        let newArtistName = document.getElementById("edit-song-modal-artist-textfield").value;
        let newyoutubeId = document.getElementById("edit-song-modal-youTubeId-textfield").value;
        let newSong = {title: newSongName, artist: newArtistName, youTubeId: newyoutubeId}

        let transaction = new EditSong_Transaction(this,index,oldSong,newSong)
        this.tps.addTransaction(transaction);
    }

    renameSong = (Id,newSong) => {
        this.state.currentList.songs.splice(Id-1,1,newSong)
        this.setState(prevState => ({
            currentList: this.state.currentList,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            sessionData: this.state.sessionData,
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: prevState.RenameSongID
        }), () => {
            //let modal = document.getElementById("RenameSongModal");
            this.db.mutationUpdateList(this.state.currentList);
            this.db.mutationUpdateSessionData(this.state.sessionData);
            //modal.classList.remove("is-visible");
            
        });
    }



    // renameSong = (Id) => {
    //     let newSongName = document.getElementById("edit-song-modal-title-textfield").value;
    //     let newArtistName = document.getElementById("edit-song-modal-artist-textfield").value;
    //     let newyoutubeId = document.getElementById("edit-song-modal-youTubeId-textfield").value;
    //     let newSong = {title: newSongName, artist: newArtistName, youTubeId: newyoutubeId}
    //     this.state.currentList.songs.splice(Id-1,1,newSong)
    //     this.setState(prevState => ({
    //         currentList: this.state.currentList,
    //         listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
    //         sessionData: this.state.sessionData,
    //         DeleteSongID: prevState.DeleteSongID,
    //         RenameSongID: prevState.RenameSongID
    //     }), () => {
    //         //let modal = document.getElementById("RenameSongModal");
    //         this.db.mutationUpdateList(this.state.currentList);
    //         this.db.mutationUpdateSessionData(this.state.sessionData);
    //         //modal.classList.remove("is-visible");
            
    //     });
    // }

    RedodeleteSong = (index, deleteSong) => {
        this.state.currentList.songs.splice(index,0,deleteSong)
        this.setState(prevState => ({
            currentList: this.state.currentList,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            sessionData: this.state.sessionData,
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: prevState.RenameSongID
        }), () => {
            this.db.mutationUpdateList(this.state.currentList);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }

    // Delete Song
    deleteSong = (index) =>{
        // let playlistkey = this.state.currentList.key;
        // console.log("playlistname: "+ playlistkey);
        // let title = this.state.currentList.songs[key].title
        // console.log("Key content: "+this.state.currentList.songs[key].title);
        this.state.currentList.songs.splice(index,1)
        this.setState(prevState => ({
            currentList: this.state.currentList,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            sessionData: this.state.sessionData,
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: prevState.RenameSongID
        }), () => {
           // let modal = document.getElementById("delete-song-modal");
            this.db.mutationUpdateList(this.state.currentList);
            this.db.mutationUpdateSessionData(this.state.sessionData);
            // modal.classList.remove("is-visible");
        });
    }

    //When click the confirm button on deleteSongModal, call the deltesong function
    deleteMarkedSong = () => {
        //this.deleteSong(this.state.DeleteSongID-1);
        let index = this.state.DeleteSongID-1
        let song = this.state.currentList.songs[this.state.DeleteSongID-1]
        let transaction = new DeleteSong_Transaction(this,index,song);
        this.tps.addTransaction(transaction)
        this.hideDeleteSongModal();
    }



    //get delteed song Id through the processof: SongCard -> PlaylistCard -> App.js
    //And show deleteSongModal
    markSongForDeletion = (sonMsg) =>{
        this.setState(prevState => ({
            currentList: prevState.currentList,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            sessionData: prevState.sessionData,
            DeleteSongID: sonMsg,
            RenameSongID: prevState.RenameSongID
        }), () => {
            // PROMPT THE USER
            this.showDeleteSongModal();
        });        
    }
   
    markSongForRename = (RenameSonMsg) =>{
        this.setState(prevState => ({
            currentList: prevState.currentList,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            sessionData: prevState.sessionData,
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: RenameSonMsg
        }), () => {
            // PROMPT THE USER
            this.showRenameSongModal();
        });        
    }

    showDeleteSongModal(){
        let modal = document.getElementById("delete-song-modal");
        modal.classList.add("is-visible");
        
    }

    hideDeleteSongModal(){
        let modal = document.getElementById("delete-song-modal");
        modal.classList.remove("is-visible");
    }

  

    showRenameSongModal(){
        let modal = document.getElementById("edit-song-modal");
        modal.classList.add("is-visible");
    }

    hideRenameSongModal(){
        let modal = document.getElementById("edit-song-modal");
        modal.classList.remove("is-visible");
    }

    
    markListForDeletion = (keyPair) => {
        this.setState(prevState => ({
            currentList: prevState.currentList,
            listKeyPairMarkedForDeletion : keyPair,
            sessionData: prevState.sessionData,
            DeleteSongID: prevState.DeleteSongID,
            RenameSongID: prevState.RenameSongID
        }), () => {
            // PROMPT THE USER
            this.showDeleteListModal();
        });
    }
    // THIS FUNCTION SHOWS THE MODAL FOR PROMPTING THE USER
    // TO SEE IF THEY REALLY WANT TO DELETE THE LIST
    showDeleteListModal() {
        let modal = document.getElementById("delete-list-modal");
        modal.classList.add("is-visible");
    }
    // THIS FUNCTION IS FOR HIDING THE MODAL
    hideDeleteListModal() {
        let modal = document.getElementById("delete-list-modal");
        modal.classList.remove("is-visible");
    }



    render() { 
        this.ShortcutDetect()
        let canAddSong = this.state.currentList !== null;
        let canUndo = this.tps.hasTransactionToUndo();
        let canRedo = this.tps.hasTransactionToRedo();
        let canClose = this.state.currentList !== null;
        
        if(!this.state.currentList)
        {
            canAddSong = false;
            canUndo = false;
            canRedo = false;
            canClose = false;
            console.log("currentlist is empty");
        }
        else{
            canAddSong = true;
            canUndo = false;
            canRedo = false;
            canClose = true;
            console.log("currentlist is not empty");
        }
        
       

    
        
        return (
            <div id="root">
                <Banner />
                <SidebarHeading
                    createNewListCallback={this.createNewList}
                />
                <SidebarList
                    currentList={this.state.currentList}
                    keyNamePairs={this.state.sessionData.keyNamePairs}
                    deleteListCallback={this.markListForDeletion}
                    loadListCallback={this.loadList}
                    renameListCallback={this.renameList}
                />
                <EditToolbar
                    canAddSong={canAddSong}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    canClose={canClose} 
                    undoCallback={this.undo}
                    redoCallback={this.redo}
                    closeCallback={this.closeCurrentList}
                    createNewSongCallback = {this.addAddSongTransaction}
                />
                <PlaylistCards
                    currentList={this.state.currentList}
                    deleteSongCallback={this.markSongForDeletion}
                    moveSongCallback={this.addMoveSongTransaction}
                    renameSongCallback={this.markSongForRename} />
                <Statusbar 
                    currentList={this.state.currentList} />
                <DeleteListModal
                    listKeyPair={this.state.listKeyPairMarkedForDeletion}
                    hideDeleteListModalCallback={this.hideDeleteListModal}
                    deleteListCallback={this.deleteMarkedList}
                />
                <DeleteSongModal
                    songKeyPair = {this.state.currentList}
                    songId = {this.state.DeleteSongID}
                    hideDeleteSongModalCallback = {this.hideDeleteSongModal}
                    deleteSongCallback={this.deleteMarkedSong}
                />

                <RenameSongModal
                    RenameSongKeyPair = {this.state.currentList}
                    renameId = {this.state.RenameSongID}
                    hideRenameSongModalCallback = {this.hideRenameSongModal}
                    RenameSongCallback={this.renameMarkedSong}
                />
            </div>
        );
    }
}

export default App;

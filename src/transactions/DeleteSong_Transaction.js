import jsTPS_Transaction from "../common/jsTPS.js"
/**
 * DeleteSong_Transaction
 * 
 * This class represents a transaction that works with drag
 * and drop. It will be managed by the transaction stack.
 * 
 * @author McKilla Gorilla
 * @author Zhenchao Xia
 */
export default class DeleteSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, index, song) {
        super();
        this.app = initApp;
        this.index = index;
        this.song = song;
    }

    doTransaction() {
        //this.app.moveSong(this.oldSongIndex, this.newSongIndex);
        this.app.deleteSong(this.index)
    }
    
    undoTransaction() {
       this.app.RedodeleteSong(this.index,this.song)
    }
}
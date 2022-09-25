import React from "react";

export default class SongCard extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isDragging: false,
            draggedTo: false
        }
    }
    handleDragStart = (event) => {
        event.dataTransfer.setData("song", event.target.id);
        this.setState(prevState => ({
            isDragging: true,
            draggedTo: prevState.draggedTo
        }));
    }
    handleDragOver = (event) => {
        event.preventDefault();
        this.setState(prevState => ({
            isDragging: prevState.isDragging,
            draggedTo: true
        }));
    }
    handleDragEnter = (event) => {
        event.preventDefault();
        this.setState(prevState => ({
            isDragging: prevState.isDragging,
            draggedTo: true
        }));
    }
    handleDragLeave = (event) => {
        event.preventDefault();
        this.setState(prevState => ({
            isDragging: prevState.isDragging,
            draggedTo: false
        }));
    }
    handleDrop = (event) => {
        event.preventDefault();
        let target = event.target;
        let targetId = target.id;
        targetId = targetId.substring(target.id.indexOf("-") + 1);
        let sourceId = event.dataTransfer.getData("song");
        sourceId = sourceId.substring(sourceId.indexOf("-") + 1);
        
        this.setState(prevState => ({
            isDragging: false,
            draggedTo: false
        }));

        // ASK THE MODEL TO MOVE THE DATA
        this.props.moveCallback(sourceId, targetId);
    }

    getItemNum = () => {
        return this.props.id.substring("playlist-song-".length);
    }

    handleDeleteSong = (event) => {
        event.stopPropagation();
        this.props.deleteSongCallback(this.getItemNum());   
    }

    handleDoubleClick = (event) => {
        event.stopPropagation();
        this.props.renameSongCallback(this.getItemNum());   
        console.log("this.getItemNum(): "+ this.getItemNum())
    }

    render() {
        const { song } = this.props;
        let num = this.getItemNum();
        // console.log("title: "+ this.props.song.title)
        // console.log("id: "+ this.props.id)
        // console.log("key: "+ this.props.key)
        let desirelink = "https://www.youtube.com/watch?v=" +song.youTubeId;
        let itemClass = "playlister-song";

        if (this.state.draggedTo) {
            itemClass = "playlister-song-dragged-to";
        }
        return (
            <div
                id={'song-' + num}
                className={itemClass}
                onDragStart={this.handleDragStart}
                onDragOver={this.handleDragOver}
                onDragEnter={this.handleDragEnter}
                onDragLeave={this.handleDragLeave}
                onDrop={this.handleDrop}
                draggable="true"
                onDoubleClick={this.handleDoubleClick}
            >
             {num + "."} <a href= {desirelink}>{song.title} by {song.artist}</a>
             <input
                        type="button"
                        id={"delete-song-" + num}
                        className="playlist-song-button"
                        value={"X"}
                        onClick = {this.handleDeleteSong}
                        />
            </div>
            
        )
    }
}
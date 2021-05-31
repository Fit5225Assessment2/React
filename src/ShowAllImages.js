import React from "react"
import Amplify, { API, Storage } from 'aws-amplify';
import awsconfig from './aws-exports'
import Alert from '@material-ui/lab/Alert'
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';

Amplify.configure(awsconfig);

function ImageComponent(props){
    const image = props.image
    const imageStyle = {
        width: "64px",
        height: "64px",
    }
    const [tag, setTag] = React.useState('');
    const [showAlert, setShowAlert] = React.useState('');

    const handleTagChange = (event) => {
        setTag(event.target.value)
    }

    const addTag = () => {
        const params = { 'etag': image['eTag'], 'tag': tag }
        API.put('fit5225g20api', '/image', { queryStringParameters: params })
            .then(response => {
                setShowAlert('Add tag' + tag + 'successfully')
            })
            .catch(error => {
                console.log(error);
            })
    }

    const deleteImageFromDB = () => {
        const params = { etag: image['eTag'] }

        API.del('fit5225g20api', '/image', { queryStringParameters: params })
            .then(response => {
                deleteImageFromS3()
            })
            .catch(error => {
                console.log(error);
            })
    }

    const deleteImageFromS3 = () => {
        const key = image['key']
        Storage.remove(key, { level: 'private' })
            .then(() => {
                props.onDeleteImage()
            })
            .catch(err => console.log(err))
    }

    return (
        <span>
            <div>
                <img style={{ imageStyle }} src={image['url']} />
                <label>
                    Add tag:
                    <input type="text" name="tag" value={tag} onChange={handleTagChange} />
                    <button onClick={() => addTag()}>Add</button>
                </label>
                {showAlert !== '' ? <Alert onClose={() => { setShowAlert('') }}>{showAlert}</Alert> : null}
                <button onClick={() => deleteImageFromDB()}>Delete</button>
            </div>
        </span>
    )
}

function ShowAllImamges(){
    const [authState, setAuthState] = React.useState();
    const [user, setUser] = React.useState();

    React.useEffect(() => {
        return onAuthUIStateChange((nextAuthState, authData) => {
            setAuthState(nextAuthState);
            setUser(authData)
        });
    }, []);

    React.useEffect(() => {
        if (authState == AuthState.SignedIn) {
            loadImageETag()
        }
    }, [authState])

    //load image
    const [albumProgress, setAlbumProgess] = React.useState('loading')
    const [tagStr, setTagStr] = React.useState('');
    const [eTags, setETags] = React.useState([]);
    const [images, setImages] = React.useState([]);

    const loadImageETag = async () => {
        setAlbumProgess('loading')
        const tags = tagStr.split(',')
        const tagsTmp = tags.map((each) => {
            return each.trim()
        })
        var params = {}
        tagsTmp.forEach(function (value, i) {
            params['tag' + i] = value
        });

        API.get('g20fit5225api', '/Images', {queryStringParameters: params})
            .then(response => {
                setETags(response);

            })
            .catch(error => {
                console.log(error);
            })
    }

    React.useEffect(() => {
        if (authState === AuthState.SignedIn && user) {
            loadImage()
        }
    }, [eTags])

    const loadImage = () => {
        Storage.list('', { level: 'private' })
            .then(async (result) => {
                var displayImages = []
                for (const [index, image] of result.entries()) {
                    if (eTags.length > 0 && !eTags.includes(image['eTag'])) {
                        continue
                    }
                    const singedURL = await Storage.get(image['key'], { level: 'private' });
                    const tmpImage = image
                    tmpImage['url'] = singedURL
                    displayImages.push(tmpImage)
                }
                setImages(displayImages)
                setAlbumProgess('loaded')
            })
    }

    return(
        <div>
            <h1>This is the queries page</h1>
        </div>
    )
    
    }

export default ShowAllImamges
import React from "react"
import Amplify, {Storage} from 'aws-amplify';
import awsconfig from './aws-exports'
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

Amplify.configure(awsconfig);

function UploadShowPage(){
    const [uploadProgress, setUploadProgress] = React.useState('getUpload');
    const [uploadImage, setUploadImage] = React.useState();
    const [errorMessage, setErrorMessage] = React.useState();
    const upload = async() => {
    try{
        setUploadProgress('uploading')
        await Storage.put(`${'image' + Date.now()}.jpeg`, uploadImage, {level: 'private',contentType: 'image/jpeg'});
        setUploadProgress('uploadFinish')
    } catch (error) {
        console.log('Something wrong', error);
        setErrorMessage(error.message)
        setUploadProgress('uploadError')
    }
    }
    
    switch (uploadProgress) {
        case 'getUpload':
          return (
            <>
              <input type="file" accept="image/*" onChange={e => setUploadImage(e.target.files[0])} />
              <Button variant="contained" color="primary" component="span">
                Upload
              </Button><br />
            </>
          )
        case 'uploading':
          return <h2>Uploading</h2>
        case 'uploadFinish' :
          return(
            <>
              <div>
                 upload successfully!!
              </div>
              <input type="file" accept="image/*" onChange={e => setUploadImage(e.target.files[0])} />
              <Button variant="contained" color="primary" component="span">
                Upload
              </Button><br />
            </>
          )
        case 'Error' :
          return(
            <>
              <div>
                  Error message = {errorMessage}
              </div>
              <input type="file" accept="image/*" onChange={e => setUploadImage(e.target.files[0])} />
              <Button variant="contained" color="primary" component="span">
                Upload
              </Button><br />
            </>
          )

        default:
          break;
      }
    }

export default UploadShowPage
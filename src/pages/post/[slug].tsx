import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  const textSize = post.data.content.reduce((acc, item) => {
    const heading = item.heading.split(' ').length;
    const body = RichText.asText(item.body).split(' ').length;

    return heading + body + acc;
  }, 0);

  const timeToRead = Math.ceil(textSize / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <Header />

      <div className={styles.container}>
        <img src={post.data.banner.url} alt="Background" />

        <main className={`${styles.content} ${commonStyles.post}`}>
          <h1>{post.data.title}</h1>

          <div className={styles.icons}>
            <div>
              <FiCalendar />
              {format(
                new Date(post.first_publication_date),
                'dd MMM yyyy'
              ).toLowerCase()}
            </div>

            <div>
              <FiUser />
              {post.data.author}
            </div>

            <div>
              <FiClock /> {timeToRead} min
            </div>
          </div>

          <article>
            {post.data.content.map(content => (
              <div key={content.heading}>
                <h2>{content.heading}</h2>

                <p>
                  {content.body.map(body => (
                    <span key={body.text}>{body.text}</span>
                  ))}
                </p>
              </div>
            ))}
          </article>
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { pageSize: 100, fetch: ['post.uid'] }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 30 * 60, // 30 minutes
  };
};
